var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function handleOptions(request) {
  return new Response(null, {
    headers: CORS_HEADERS,
    status: 204
  });
}
__name(handleOptions, "handleOptions");
async function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
__name(constantTimeCompare, "constantTimeCompare");
async function hmacSha256(key, data) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return signature;
}
__name(hmacSha256, "hmacSha256");
async function sha256(data) {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
function base64urlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
__name(base64urlEncode, "base64urlEncode");
async function generateLicenseKey(email, plan, secret) {
  const issuedAt = Math.floor(Date.now() / 1e3);
  let expiresAt = null;
  if (plan === "annual") expiresAt = issuedAt + 365 * 24 * 60 * 60;
  if (plan === "monthly") expiresAt = issuedAt + 30 * 24 * 60 * 60;
  const payload = {
    e: await sha256(email),
    p: plan,
    i: issuedAt,
    x: expiresAt
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64urlEncode(new TextEncoder().encode(payloadStr));
  const signature = await hmacSha256(secret, payloadB64);
  const signatureB64 = base64urlEncode(signature);
  return `${payloadB64}.${signatureB64}`;
}
__name(generateLicenseKey, "generateLicenseKey");
async function checkRateLimit(env, ip, limit, windowSeconds) {
  const key = `rl:${ip}:${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`;
  const current = await env.LICENSES.get(key);
  const count = current ? parseInt(current) : 0;
  if (count >= limit) return false;
  await env.LICENSES.put(key, (count + 1).toString(), { expirationTtl: windowSeconds });
  return true;
}
__name(checkRateLimit, "checkRateLimit");
var index_default = {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return handleOptions(request);
    const url = new URL(request.url);
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;
    const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET;
    const LICENSE_SECRET = env.LICENSE_SECRET;
    try {
      if (url.pathname === "/analytics/event" && request.method === "POST") {
        const { event } = await request.json();
        if (event) {
          await env.LICENSES.put(`analytics:${event}:${Date.now()}`, "1", { expirationTtl: 86400 * 90 });
        }
        return new Response("OK", { status: 200, headers: CORS_HEADERS });
      }
      if (url.pathname === "/payment/razorpay/create-order" && request.method === "POST") {
        if (!await checkRateLimit(env, ip, 20, 3600)) {
          return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: CORS_HEADERS });
        }
        try {
          const body = await request.json();
          const { amount_paise, currency, plan } = body;
          if (!amount_paise || !currency || !plan) {
            return new Response(JSON.stringify({ error: "Missing required parameters: amount_paise, currency, or plan" }), { status: 400, headers: CORS_HEADERS });
          }
          const amount = parseInt(amount_paise);
          if (isNaN(amount) || amount <= 0) {
            return new Response(JSON.stringify({ error: "Invalid amount_paise. Must be a positive integer." }), { status: 400, headers: CORS_HEADERS });
          }
          const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
          const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              amount,
              currency,
              receipt: `ik_${Date.now()}`
            })
          });
          const order = await response.json();
          if (!response.ok) {
            return new Response(JSON.stringify({
              error: order.error?.description || order.error || "Razorpay Order Failed",
              details: order
            }), { status: response.status, headers: CORS_HEADERS });
          }
          return new Response(JSON.stringify({ order_id: order.id, amount: order.amount, currency: order.currency }), { headers: CORS_HEADERS });
        } catch (e) {
          return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: CORS_HEADERS });
        }
      }
      if (url.pathname === "/payment/razorpay/verify" && request.method === "POST") {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan } = await request.json();
        const data = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSig = await hmacSha256(RAZORPAY_KEY_SECRET, data);
        const hmacHex = Array.from(new Uint8Array(expectedSig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (!await constantTimeCompare(razorpay_signature, hmacHex)) {
          return new Response(JSON.stringify({ error: "Signature verification failed" }), { status: 400, headers: CORS_HEADERS });
        }
        const licenseKey = await generateLicenseKey(email, plan, LICENSE_SECRET);
        const payloadB64 = licenseKey.split(".")[0];
        await env.LICENSES.put(`license:${payloadB64}`, JSON.stringify({
          plan,
          email,
          issuedAt: Math.floor(Date.now() / 1e3),
          expiresAt: plan === "annual" ? Math.floor(Date.now() / 1e3) + 365 * 24 * 60 * 60 : plan === "monthly" ? Math.floor(Date.now() / 1e3) + 30 * 24 * 60 * 60 : null,
          revoked: false
        }));
        return new Response(JSON.stringify({ licenseKey }), { headers: CORS_HEADERS });
      }
      if (url.pathname === "/payment/razorpay/webhook" && request.method === "POST") {
        const signature = request.headers.get("x-razorpay-signature");
        const body = await request.text();
        const expectedSig = await hmacSha256(RAZORPAY_WEBHOOK_SECRET, body);
        const expectedSigHex = Array.from(new Uint8Array(expectedSig)).map((b) => b.toString(16).padStart(2, "0")).join("");
        if (!await constantTimeCompare(signature, expectedSigHex)) {
          return new Response("Invalid signature", { status: 400 });
        }
        const event = JSON.parse(body);
        if (event.event === "payment.captured") {
          const payment = event.payload.payment.entity;
          const email = payment.email;
          const plan = payment.notes?.plan || "monthly";
          const licenseKey = await generateLicenseKey(email, plan, LICENSE_SECRET);
          const payloadB64 = licenseKey.split(".")[0];
          await env.LICENSES.put(`license:${payloadB64}`, JSON.stringify({
            plan,
            email,
            issuedAt: Math.floor(Date.now() / 1e3),
            expiresAt: plan === "annual" ? Math.floor(Date.now() / 1e3) + 365 * 24 * 60 * 60 : plan === "monthly" ? Math.floor(Date.now() / 1e3) + 30 * 24 * 60 * 60 : null,
            revoked: false
          }));
        }
        return new Response("OK", { status: 200 });
      }
      if (url.pathname === "/payment/paddle/webhook" && request.method === "POST") {
        const signature = request.headers.get("paddle-signature");
        const body = await request.text();
        if (!signature) return new Response("Unauthorized", { status: 400 });
        const event = JSON.parse(body);
        if (event.event_type === "transaction.completed") {
          const email = event.data.customer.email;
          const plan = event.data.product_id === "annual" ? "annual" : "monthly";
          const licenseKey = await generateLicenseKey(email, plan, LICENSE_SECRET);
          const payloadB64 = licenseKey.split(".")[0] ;
          await env.LICENSES.put(`license:${payloadB64}`, JSON.stringify({
            plan,
            email,
            issuedAt: Math.floor(Date.now() / 1e3),
            expiresAt: plan === "annual" ? Math.floor(Date.now() / 1e3) + 365 * 24 * 60 * 60 : plan === "monthly" ? Math.floor(Date.now() / 1e3) + 30 * 24 * 60 * 60 : null,
            revoked: false
          }));
        } else if (event.event_type === "transaction.refunded") {
          const licenseId = event.data.custom_data?.license_id;
          if (licenseId) {
            const existing = await env.LICENSES.get(`license:${licenseId}`);
            if (existing) {
              const data = JSON.parse(existing);
              data.revoked = true;
              await env.LICENSES.put(`license:${licenseId}`, JSON.stringify(data));
            }
          }
        }
        return new Response("OK", { status: 200 });
      }
      if (url.pathname === "/license/verify" && request.method === "GET") {
        if (!await checkRateLimit(env, ip, 30, 3600)) {
          return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: CORS_HEADERS });
        }
        const key = url.searchParams.get("key");
        if (!key) return new Response(JSON.stringify({ error: "Missing key" }), { status: 400, headers: CORS_HEADERS });
        const [payloadB64, signatureB64] = key.split(".");
        if (!payloadB64 || !signatureB64) return new Response(JSON.stringify({ error: "Invalid key format" }), { status: 400, headers: CORS_HEADERS });
        const expectedSig = await hmacSha256(LICENSE_SECRET, payloadB64);
        const expectedSigB64 = base64urlEncode(expectedSig);
        if (signatureB64 !== expectedSigB64) {
          return new Response(JSON.stringify({ valid: false, error: "Invalid signature" }), { headers: CORS_HEADERS });
        }
        const kvData = await env.LICENSES.get(`license:${payloadB64}`);
        if (!kvData) {
          return new Response(JSON.stringify({ valid: false, error: "License not found" }), { headers: CORS_HEADERS });
        }
        const data = JSON.parse(kvData);
        if (data.revoked) {
          return new Response(JSON.stringify({ valid: false, error: "License revoked" }), { headers: CORS_HEADERS });
        }
        const now = Math.floor(Date.now() / 1e3);
        const isExpired = data.expiresAt && data.expiresAt < now;
        return new Response(JSON.stringify({
          valid: !isExpired,
          plan: data.plan,
          expiresAt: data.expiresAt ? new Date(data.expiresAt * 1e3).toISOString() : null,
          daysRemaining: data.expiresAt ? Math.ceil((data.expiresAt - now) / (24 * 60 * 60)) : null
        }), { headers: CORS_HEADERS });
      }
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS_HEADERS });
    }
  }
};
export {
  index_default as default
};
