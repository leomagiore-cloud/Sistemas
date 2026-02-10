// app/stores/select/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyStorePassword, setActiveStore } from '@/lib/store-auth';

export default function StoreSelectionPage() {
  const [selectedStore, setSelectedStore] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Mock - você buscará do Supabase
  const userStores = [
    { id: 1, name: 'Adega Central', requiresPassword: true },
    { id: 2, name: 'Adega Filial 1', requiresPassword: false },
  ];
  
  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setError('');
    if (!store.requiresPassword) {
      enterStore(store.id);
    }
  };
  
  const enterStore = async (storeId, pwd = null) => {
    setLoading(true);
    try {
      // Verifica senha se necessário
      if (pwd) {
        const isValid = await verifyStorePassword(storeId, pwd);
        if (!isValid) {
          setError('Senha incorreta');
          return;
        }
      }
      
      // Salva sessão da adega ativa
      await setActiveStore(storeId);
      
      // Redireciona para dashboard da adega
      router.push(`/stores/${storeId}/dashboard`);
    } catch (err) {
      setError('Erro ao acessar adega');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitPassword = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Digite a senha');
      return;
    }
    enterStore(selectedStore.id, password);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold mb-6">Selecione uma Adega</h1>
        
        {!selectedStore ? (
          // Lista de adegas
          <div className="space-y-3">
            {userStores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleSelectStore(store)}
                className="w-full p-4 border rounded-lg text-left hover:bg-gray-50"
              >
                <div className="font-medium">{store.name}</div>
                {store.requiresPassword && (
                  <div className="text-sm text-gray-500">
                    🔒 Requer senha
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          // Tela de senha (se necessário)
          <div>
            <div className="mb-4 p-3 bg-blue-50 rounded">
              Selecionada: <strong>{selectedStore.name}</strong>
            </div>
            
            {selectedStore.requiresPassword ? (
              <form onSubmit={handleSubmitPassword}>
                <div className="mb-4">
                  <label className="block mb-2">Senha da Adega</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Digite a senha"
                    autoFocus
                  />
                </div>
                
                {error && (
                  <div className="mb-3 text-red-600 text-sm">{error}</div>
                )}
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStore(null)}
                    className="px-4 py-2 border rounded"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <p>Redirecionando para {selectedStore.name}...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}