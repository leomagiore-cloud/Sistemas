import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, PlusCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // ← IMPORTAÇÃO CORRETA
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SelectStore() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erro ao carregar adegas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = (store: any) => {
    localStorage.setItem('active_store_id', store.id);
    localStorage.setItem('active_store_name', store.name);
    localStorage.setItem('store_session_start', new Date().toISOString());
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando suas adegas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Selecionar Adega</h1>
          <p className="text-muted-foreground">
            {stores.length > 0 
              ? `Você tem ${stores.length} adega${stores.length !== 1 ? 's' : ''}`
              : 'Crie sua primeira adega para começar'}
          </p>
        </div>

        {stores.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-xl font-semibold mb-3">Nenhuma adega encontrada</h3>
              <p className="text-muted-foreground mb-8">
                Você ainda não possui adegas cadastradas.
              </p>
              <Button 
                onClick={() => navigate('/stores/create-first')}
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Criar Primeira Adega
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <Card 
                key={store.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSelectStore(store)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      store.requires_password 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      <span className="text-xs font-medium">
                        {store.requires_password ? 'Com senha' : 'Livre'}
                      </span>
                    </div>
                  </div>
                  
                  {store.address && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {store.address}
                    </p>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
