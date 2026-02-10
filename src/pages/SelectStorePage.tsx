// src/pages/SelectStore.tsx - VERSÃO MÍNIMA FUNCIONAL
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Mock data para teste
const mockStores = [
  { id: '1', name: 'Adega Central', requires_password: false },
  { id: '2', name: 'Adega Filial', requires_password: true },
];

export default function SelectStore() {
  const navigate = useNavigate();

  useEffect(() => {
    // Se já tem adega selecionada, vai para dashboard
    const activeStoreId = localStorage.getItem('active_store_id');
    if (activeStoreId) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSelectStore = (storeId: string, storeName: string) => {
    localStorage.setItem('active_store_id', storeId);
    localStorage.setItem('active_store_name', storeName);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Selecionar Adega</h1>
        
        <div className="space-y-4">
          {mockStores.map((store) => (
            <Card key={store.id} className="cursor-pointer hover:bg-gray-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{store.name}</h3>
                    <p className="text-sm text-gray-500">
                      {store.requires_password ? '🔒 Com senha' : '🔓 Sem senha'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleSelectStore(store.id, store.name)}
                  >
                    Selecionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/stores/create-first')}
          >
            Criar Nova Adega
          </Button>
        </div>
      </div>
    </div>
  );
}