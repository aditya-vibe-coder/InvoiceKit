# Backend Architecture Overview

InvoiceKit Pro utilizes a serverless architecture to ensure high availability, low latency, and maximum security.

## Tech Stack
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Storage**: Cloudflare KV (Key-Value Store) for license management and analytics.
- **Payment Gateway**: Razorpay Integration for secure Indian payment processing.

## How it Works
1. **Order Creation**: The frontend requests a payment order from the Worker, which communicates with Razorpay's API to generate a unique `order_id`.
2. **Payment Verification**: Once a payment is completed, the system verifies the Razorpay signature to prevent fraud.
3. **License Issuance**: Upon successful verification, a cryptographically signed license key is generated and stored in the KV store, granting the user access to Pro features.
4. **Edge Validation**: License checks are performed at the edge, ensuring that the app remains fast and responsive regardless of the user's location.

## Security
- **HMAC Signing**: All licenses are signed using HMAC-SHA256 to prevent tampering.
- **Rate Limiting**: API endpoints are protected by rate limiting to prevent abuse.
- **Secret Management**: All sensitive keys are stored as encrypted secrets within the Cloudflare environment.
