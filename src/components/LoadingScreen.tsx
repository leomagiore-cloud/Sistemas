// src/components/LoadingScreen.tsx
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ 
  message = "Carregando...", 
  fullScreen = true 
}: LoadingScreenProps) {
  const Container = fullScreen ? 'div' : 'div';
  
  return (
    <Container className={`${fullScreen ? 'min-h-screen' : 'min-h-[200px]'} flex flex-col items-center justify-center`}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        {message && (
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </Container>
  );
}

// Versão alternativa (se quiser mais opções)
export function LoadingSpinner({ size = "default", className = "" }: { 
  size?: "sm" | "default" | "lg"; 
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  );
}