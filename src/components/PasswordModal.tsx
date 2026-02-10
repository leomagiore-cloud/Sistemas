// components/PasswordModal.tsx
import { useState } from 'react';
import { Store } from '../types/store';
import './PasswordModal.css';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  onSubmit: (password: string) => Promise<boolean>;
}

export default function PasswordModal({ 
  isOpen, 
  onClose, 
  store, 
  onSubmit 
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Digite a senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await onSubmit(password);
      
      if (!isValid) {
        setError('Senha incorreta. Tente novamente.');
        setPassword('');
      }
    } catch (err) {
      setError('Erro ao verificar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="password-modal-overlay" onClick={handleClose}>
      <div className="password-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-lock"></i> 
            Acesso à Adega
          </h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="selected-store-info">
            <h3>{store.name}</h3>
            {store.address && (
              <p className="store-address">
                <i className="fas fa-map-marker-alt"></i> 
                {store.address}
              </p>
            )}
            <p className="store-hint">
              Digite a senha definida nas configurações desta adega
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="store-password">
                <i className="fas fa-key"></i> Senha da Adega
              </label>
              
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="store-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha desta adega"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !password.trim()}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Verificando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i> Entrar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}