// middleware.js (Next.js)
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Verifica autenticação do usuário
  const {
    data: { session: userSession },
  } = await supabase.auth.getSession();
  
  if (!userSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Verifica se tem adega ativa (para rotas que precisam)
  const storeId = req.cookies.get('active_store_id')?.value;
  const pathname = req.nextUrl.pathname;
  
  // Rotas que requerem adega selecionada
  const storeProtectedPaths = [
    '/stores/dashboard',
    '/stores/products',
    '/stores/sales',
    '/stores/settings',
  ];
  
  const needsStore = storeProtectedPaths.some(path => 
    pathname.startsWith(path)
  );
  
  if (needsStore && !storeId) {
    return NextResponse.redirect(new URL('/stores/select', req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/stores/:path*',
  ],
};