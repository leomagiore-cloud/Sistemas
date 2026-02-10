
-- Criar tabela de lojas/adegas
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  open_time TEXT,
  close_time TEXT,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  sound_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_backup BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vínculo usuário-loja
CREATE TABLE public.user_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'funcionario' CHECK (role IN ('proprietario', 'gerente', 'funcionario')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Adicionar store_id nas tabelas existentes
ALTER TABLE public.products ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.deliveries ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.stock_movements ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.financial_transactions ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stores ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário tem acesso à loja
CREATE OR REPLACE FUNCTION public.user_has_store_access(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_stores
    WHERE user_id = auth.uid() AND store_id = p_store_id
  )
$$;

-- Função para pegar lojas do usuário
CREATE OR REPLACE FUNCTION public.get_user_stores()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.user_stores WHERE user_id = auth.uid()
$$;

-- Políticas para stores
CREATE POLICY "Users can view their stores"
ON public.stores FOR SELECT
USING (id IN (SELECT public.get_user_stores()));

CREATE POLICY "Store owners can update their stores"
ON public.stores FOR UPDATE
USING (id IN (
  SELECT store_id FROM public.user_stores 
  WHERE user_id = auth.uid() AND role IN ('proprietario', 'gerente')
));

CREATE POLICY "Authenticated users can create stores"
ON public.stores FOR INSERT
WITH CHECK (is_authenticated_user());

-- Políticas para user_stores
CREATE POLICY "Users can view their store memberships"
ON public.user_stores FOR SELECT
USING (user_id = auth.uid() OR store_id IN (SELECT public.get_user_stores()));

CREATE POLICY "Store owners can manage memberships"
ON public.user_stores FOR ALL
USING (store_id IN (
  SELECT store_id FROM public.user_stores 
  WHERE user_id = auth.uid() AND role = 'proprietario'
));

CREATE POLICY "Users can create their own membership"
ON public.user_stores FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Atualizar políticas das tabelas para filtrar por store_id
-- Products
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Users can view products from their stores"
ON public.products FOR SELECT
USING (store_id IN (SELECT public.get_user_stores()) OR store_id IS NULL);

DROP POLICY IF EXISTS "Admins and managers can insert products" ON public.products;
CREATE POLICY "Users can insert products in their stores"
ON public.products FOR INSERT
WITH CHECK (store_id IN (SELECT public.get_user_stores()));

DROP POLICY IF EXISTS "Admins and managers can update products" ON public.products;
CREATE POLICY "Users can update products in their stores"
ON public.products FOR UPDATE
USING (store_id IN (SELECT public.get_user_stores()));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Users can delete products in their stores"
ON public.products FOR DELETE
USING (store_id IN (SELECT public.get_user_stores()));

-- Customers
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
CREATE POLICY "Users can view customers from their stores"
ON public.customers FOR SELECT
USING (store_id IN (SELECT public.get_user_stores()) OR store_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Users can insert customers in their stores"
ON public.customers FOR INSERT
WITH CHECK (store_id IN (SELECT public.get_user_stores()));

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Users can update customers in their stores"
ON public.customers FOR UPDATE
USING (store_id IN (SELECT public.get_user_stores()));

-- Sales
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;
CREATE POLICY "Users can view sales from their stores"
ON public.sales FOR SELECT
USING (store_id IN (SELECT public.get_user_stores()) OR store_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
CREATE POLICY "Users can insert sales in their stores"
ON public.sales FOR INSERT
WITH CHECK (store_id IN (SELECT public.get_user_stores()));

DROP POLICY IF EXISTS "Authenticated users can update sales" ON public.sales;
CREATE POLICY "Users can update sales in their stores"
ON public.sales FOR UPDATE
USING (store_id IN (SELECT public.get_user_stores()));

-- Deliveries
DROP POLICY IF EXISTS "Authenticated users can view deliveries" ON public.deliveries;
CREATE POLICY "Users can view deliveries from their stores"
ON public.deliveries FOR SELECT
USING (store_id IN (SELECT public.get_user_stores()) OR store_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can manage deliveries" ON public.deliveries;
CREATE POLICY "Users can manage deliveries in their stores"
ON public.deliveries FOR ALL
USING (store_id IN (SELECT public.get_user_stores()) OR store_id IS NULL);

-- Stock Movements
DROP POLICY IF EXISTS "Authenticated users can view stock_movements" ON public.stock_movements;
CREATE POLICY "Users can view stock_movements from their stores"
ON public.stock_movements FOR SELECT
USING (store_id IN (SELECT public.get_user_stores()) OR store_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can insert stock_movements" ON public.stock_movements;
CREATE POLICY "Users can insert stock_movements in their stores"
ON public.stock_movements FOR INSERT
WITH CHECK (store_id IN (SELECT public.get_user_stores()));

-- Financial Transactions
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.financial_transactions;
CREATE POLICY "Users can view transactions from their stores"
ON public.financial_transactions FOR SELECT
USING (store_id IN (SELECT public.get_user_stores()) OR store_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.financial_transactions;
CREATE POLICY "Users can insert transactions in their stores"
ON public.financial_transactions FOR INSERT
WITH CHECK (store_id IN (SELECT public.get_user_stores()));

-- Trigger para updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
