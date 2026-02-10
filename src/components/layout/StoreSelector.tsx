import { Store, ChevronDown, Check } from 'lucide-react';
import { useStores } from '@/hooks/useStores';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const roleLabels: Record<string, string> = {
  proprietario: 'Proprietário',
  gerente: 'Gerente',
  funcionario: 'Funcionário'
};

export function StoreSelector() {
  const { stores, currentStore, currentStoreRole, setCurrentStore, isLoading } = useStores();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Store className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  // If no stores, show button to go to settings
  if (stores.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/configuracoes')}
        className="gap-2"
      >
        <Store className="h-4 w-4" />
        Configurar Adega
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-auto py-2 px-3">
          <Store className="h-4 w-4 text-wine" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentStore?.name || 'Selecionar'}</span>
            {currentStoreRole && (
              <span className="text-xs text-muted-foreground">
                {roleLabels[currentStoreRole] || currentStoreRole}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => setCurrentStore(store)}
            className="flex items-center justify-between"
          >
            <span>{store.name}</span>
            {store.id === currentStore?.id && (
              <Check className="h-4 w-4 text-wine" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
