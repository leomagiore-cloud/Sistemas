-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'caixa', 'repositor');

-- Enum para categorias de produtos
CREATE TYPE public.product_category AS ENUM (
  'vinho_tinto', 'vinho_branco', 'vinho_rose', 'espumante',
  'cerveja_pilsen', 'cerveja_ipa', 'cerveja_stout', 'cerveja_artesanal',
  'vodka', 'whisky', 'rum', 'gin', 'tequila', 'cachaca', 'licor',
  'refrigerante', 'suco', 'agua', 'energetico',
  'gelo', 'carvao', 'narguile', 'essencia', 'acessorio', 'aperitivo', 'combo'
);

-- Enum para métodos de pagamento
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'pix', 'credito', 'debito', 'vale');

-- Enum para status de venda
CREATE TYPE public.sale_status AS ENUM ('pendente', 'concluida', 'cancelada');

-- Enum para tipo de movimentação de estoque
CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida', 'ajuste', 'perda');

-- Enum para status de delivery
CREATE TYPE public.delivery_status AS ENUM ('pendente', 'preparando', 'em_rota', 'entregue', 'cancelado');

-- Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'caixa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category product_category NOT NULL,
  barcode TEXT UNIQUE,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  promo_price DECIMAL(10,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  location TEXT,
  expiry_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT UNIQUE,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  birth_date DATE,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  seller_id UUID REFERENCES auth.users(id),
  status sale_status NOT NULL DEFAULT 'pendente',
  payment_method payment_method,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de itens da venda
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de movimentações de estoque
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  type stock_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de deliveries
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  neighborhood TEXT,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  status delivery_status NOT NULL DEFAULT 'pendente',
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de transações financeiras
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method,
  sale_id UUID REFERENCES public.sales(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar se é usuário autenticado
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para user_roles (apenas admin pode gerenciar)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para products (todos autenticados podem ver, admin/gerente podem editar)
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT USING (public.is_authenticated_user());
CREATE POLICY "Admins and managers can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "Admins and managers can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para customers
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT USING (public.is_authenticated_user());
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT WITH CHECK (public.is_authenticated_user());
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE USING (public.is_authenticated_user());

-- Políticas para sales
CREATE POLICY "Authenticated users can view sales" ON public.sales FOR SELECT USING (public.is_authenticated_user());
CREATE POLICY "Authenticated users can insert sales" ON public.sales FOR INSERT WITH CHECK (public.is_authenticated_user());
CREATE POLICY "Authenticated users can update sales" ON public.sales FOR UPDATE USING (public.is_authenticated_user());

-- Políticas para sale_items
CREATE POLICY "Authenticated users can view sale_items" ON public.sale_items FOR SELECT USING (public.is_authenticated_user());
CREATE POLICY "Authenticated users can insert sale_items" ON public.sale_items FOR INSERT WITH CHECK (public.is_authenticated_user());

-- Políticas para stock_movements
CREATE POLICY "Authenticated users can view stock_movements" ON public.stock_movements FOR SELECT USING (public.is_authenticated_user());
CREATE POLICY "Authenticated users can insert stock_movements" ON public.stock_movements FOR INSERT WITH CHECK (public.is_authenticated_user());

-- Políticas para deliveries
CREATE POLICY "Authenticated users can view deliveries" ON public.deliveries FOR SELECT USING (public.is_authenticated_user());
CREATE POLICY "Authenticated users can manage deliveries" ON public.deliveries FOR ALL USING (public.is_authenticated_user());

-- Políticas para financial_transactions
CREATE POLICY "Authenticated users can view transactions" ON public.financial_transactions FOR SELECT USING (public.is_authenticated_user());
CREATE POLICY "Authenticated users can insert transactions" ON public.financial_transactions FOR INSERT WITH CHECK (public.is_authenticated_user());

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'caixa');
  
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil em novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();