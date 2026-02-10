// app/stores/settings/page.js - Página de configurações
'use client';
import { useState } from 'react';
import { updateStorePassword } from '@/lib/stores';

export default function StoreSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }
    
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Senha deve ter pelo menos 4 caracteres' });
      return;
    }
    
    setLoading(true);
    
    try {
      // Obter storeId ativa
      const storeId = localStorage.getItem('active_store_id');
      
      // Atualizar senha
      const success = await updateStorePassword(
        storeId, 
        currentPassword, 
        newPassword
      );
      
      if (success) {
        setMessage({ 
          type: 'success', 
          text: 'Senha atualizada com sucesso!' 
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Senha atual incorreta' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Erro ao atualizar senha' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações da Adega</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Senha Atual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2">Nova Senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded"
            minLength={4}
            required
          />
        </div>
        
        <div>
          <label className="block mb-2">Confirmar Nova Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded"
            minLength={4}
            required
          />
        </div>
        
        {message.text && (
          <div className={`p-3 rounded ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Atualizando...' : 'Atualizar Senha'}
        </button>
      </form>
    </div>
  );
}