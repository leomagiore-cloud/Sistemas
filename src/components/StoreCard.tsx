// components/StoreCard.tsx
import { Store } from '../types/store';
import './StoreCard.css';

interface StoreCardProps {
  store: Store;
  onSelect: () => void;
}

export default function StoreCard({ store, onSelect }: StoreCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div 
      className={`store-card ${store.requires_password ? 'store-card-locked' : ''}`}
      onClick={onSelect}
    >
      {store.requires_password && (
        <div className="lock-icon">
          <i className="fas fa-lock"></i>
        </div>
      )}

      <div className="store-icon">
        <i className={`fas fa-${store.requires_password ? 'lock' : 'store'}`}></i>
      </div>

      <div className="store-info">
        <h3>{store.name}</h3>
        
        {store.address && (
          <p className="store-address">
            <i className="fas fa-map-marker-alt"></i> 
            {store.address}
          </p>
        )}

        <div className="store-meta">
          <span className="store-date">
            Criada em {formatDate(store.created_at)}
          </span>
          
          <span className={`store-status ${store.requires_password ? 'status-locked' : 'status-active'}`}>
            {store.requires_password ? (
              <>
                <i className="fas fa-lock"></i> Com senha
              </>
            ) : (
              <>
                <i className="fas fa-unlock"></i> Acesso livre
              </>
            )}
          </span>
        </div>
      </div>

      <div className="store-actions">
        <button className="btn-select">
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}