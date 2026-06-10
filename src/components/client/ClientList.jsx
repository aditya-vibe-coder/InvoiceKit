import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, deleteClient } from '../../lib/db';
import { getStateName } from '../../lib/gst';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import ClientForm from './ClientForm';

export default function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await getClients();
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cancelled) {
        await loadClients();
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClient = async () => {
    setShowAddModal(false);
    setEditingClient(null);
    await loadClients();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client? This will not delete their invoices.')) {
      await deleteClient(id);
      loadClients();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Button variant="primary" onClick={() => { setEditingClient(null); setShowAddModal(true); }}>
          + Add Client
        </Button>
      </div>

      <div className="relative">
        <input 
          type="text" 
          placeholder="Search clients by name or GSTIN..." 
          className="w-full px-4 py-2 pl-10 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none border-gray-300"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl border border-gray-200" />)}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState 
          icon={<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl">👥</div>}
          title="No clients found"
          description="Start by adding your first client to create invoices."
          action={<Button variant="primary" onClick={() => setShowAddModal(true)}>Add Client</Button>}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Client Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">GSTIN</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">State</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{client.name}</td>
                    <td className="px-4 py-4 text-gray-600 font-mono text-sm">{client.gstin || 'Unregistered'}</td>
                    <td className="px-4 py-4 text-gray-600">{getStateName(client.stateCode)}</td>
                    <td className="px-4 py-4 text-gray-600 text-sm">
                      <div className="flex flex-col">
                        <span>{client.email}</span>
                        <span>{client.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <Button variant="ghost" onClick={() => { setEditingClient(client); setShowAddModal(true); }}>Edit</Button>
                      <Button variant="ghost" onClick={() => handleDelete(client.id)} className="text-red-500 hover:text-red-700">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredClients.map(client => (
              <div key={client.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{client.name}</p>
                    <p className="text-xs font-mono text-gray-500">{client.gstin || 'Unregistered'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" className="p-1" onClick={() => { setEditingClient(client); setShowAddModal(true); }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" className="p-1 text-red-500" onClick={() => handleDelete(client.id)}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">State:</span> {getStateName(client.stateCode)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Email:</span> {client.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <span className="text-gray-400">Phone:</span> {client.phone || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal 
        isOpen={showAddModal} 
        onClose={() => { setShowAddModal(false); setEditingClient(null); }} 
        title={editingClient ? 'Edit Client' : 'Add New Client'}
      >
        <ClientForm 
          initialData={editingClient} 
          onSave={handleSaveClient} 
        />
      </Modal>
    </div>
  );
}
