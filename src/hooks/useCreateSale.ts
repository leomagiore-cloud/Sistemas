export const useCreateSale = () => {
  const { currentStore } = useStores();

  return useMutation({
    mutationFn: async (data: {
      items: {
        product_id: string;
        quantity: number;
        unit_price: number;
      }[];
      customer_id?: string | null;
      payment_method: string;
      discount?: number;
      total: number; // 🔴 obrigatório
      notes?: string | null;
    }) => {
      if (!currentStore) {
        throw new Error("Nenhuma adega selecionada");
      }

      // 1️⃣ cria a venda
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          store_id: currentStore.id,
          customer_id: data.customer_id,
          payment_method: data.payment_method,
          discount: data.discount ?? 0,
          total: data.total, // 🔴 AQUI
          notes: data.notes,
          status: "finalizada",
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2️⃣ cria os itens da venda
      const items = data.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.unit_price, // ou unit_price se sua tabela usar isso
        total_price: item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(items);

      if (itemsError) throw itemsError;

      return sale;
    },
  });
};
