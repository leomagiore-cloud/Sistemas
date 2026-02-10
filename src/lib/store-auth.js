// lib/store-auth.js
import { supabase } from './supabase';

// Verifica senha da adega
export async function verifyStorePassword(storeId, password) {
  const { data, error } = await supabase
    .from('stores')
    .select('store_password')
    .eq('id', storeId)
    .single();
  
  if (error || !data) return false;
  
  // Compara senhas (em produção, use hash!)
  return data.store_password === password;
}

// Define adega ativa na sessão
export async function setActiveStore(storeId) {
  // 1. Salva no localStorage/SessionStorage
  localStorage.setItem('active_store_id', storeId);
  localStorage.setItem('store_session_start', new Date().toISOString());
  
  // 2. Opcional: Salva no banco para sessões server-side
  const { data: session } = await supabase
    .from('store_sessions')
    .insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      store_id: storeId
    })
    .select()
    .single();
  
  return session;
}

// Pega adega ativa
export function getActiveStore() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('active_store_id');
}

// Verifica se tem acesso à adega
export async function checkStoreAccess(storeId) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const { data: access } = await supabase
    .from('store_employees')
    .select('*')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .single();
  
  return !!access;
}

// Middleware para proteger rotas por adega
export function withStoreAuth(Component) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    useEffect(() => {
      const storeId = getActiveStore();
      if (!storeId) {
        router.push('/stores/select');
        return;
      }
      
      // Verifica acesso
      checkStoreAccess(storeId).then(hasAccess => {
        if (!hasAccess) {
          router.push('/stores/select');
        } else {
          setIsAuthorized(true);
        }
      });
    }, []);
    
    if (!isAuthorized) return <div>Verificando acesso...</div>;
    
    return <Component {...props} />;
  };
}