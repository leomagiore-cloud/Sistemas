// pages/PDV.tsx - VERSÃO COMPLETA E CORRIGIDA
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  ShoppingBag,
  Percent,
  X,
  Truck,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  Package,
  QrCode,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useCreateSale, useCreateDelivery } from "@/hooks/useSales";
import { useCreateDelivery } from "@/hooks/useDeliveries";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface CartItem {
  product: Product;
  quantity: number;
}

/* =========================
   HELPERS
========================= */
const getProductPrice = (product: Product) => {
  return product.promo_price || product.sale_price || 0;
};

const getCategoryLabel = (category: string) => {
  const categories: Record<string, string> = {
    'vinho_tinto': 'Vinho Tinto',
    'vinho_branco': 'Vinho Branco',
    'vinho_rose': 'Vinho Rosé',
    'espumante': 'Espumante',
    'cerveja': 'Cerveja',
    'whisky': 'Whisky',
    'vodka': 'Vodka',
    'gin': 'Gin',
    'refrigerante': 'Refrigerante',
    'agua': 'Água',
    'energetico': 'Energético',
  };
  return categories[category] || category;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'vinho_tinto': 'bg-red-500/20 text-red-500 border-red-500/30',
    'vinho_branco': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    'vinho_rose': 'bg-pink-500/20 text-pink-500 border-pink-500/30',
    'espumante': 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    'cerveja': 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    'whisky': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  };
  return colors[category] || 'bg-gray-500/20 text-gray-500 border-gray-500/30';
};

/* =========================
   COMPONENT
========================= */
export default function PDV() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreateSale();
  const createDelivery = useCreateDelivery();
  const { user } = useAuth();
  const { currentStore } = useStores();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountInput, setDiscountInput] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focar no input de busca quando a página carregar
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Debug: Verificar dados importantes
  useEffect(() => {
    console.log('🔍 [PDV] Estado atual:', {
      user: user?.id,
      store: currentStore?.id,
      cartItems: cart.length,
      total,
      subtotal,
      discount
    });
  }, [cart, user, currentStore]);

  // Filtrar produtos
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery)) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  /* =========================
     CART LOGIC
  ========================= */
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      toast.error("Produto sem estoque!");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("Estoque insuficiente!");
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Limpar busca após adicionar
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock_quantity) {
              toast.error("Estoque insuficiente!");
              return item;
            }
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setNotes("");
    toast.success("Carrinho limpo!");
  };

  /* =========================
     TOTALS
  ========================= */
  const subtotal = cart.reduce(
    (sum, item) => sum + getProductPrice(item.product) * item.quantity,
    0
  );

  const total = Math.max(0, subtotal - discount);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  /* =========================
     VALIDAÇÕES
  ========================= */
  const checkStockAvailability = () => {
    const outOfStockItems = cart.filter(item => 
      item.quantity > item.product.stock_quantity
    );
    
    if (outOfStockItems.length > 0) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Estoque insuficiente:</span>
          {outOfStockItems.map(item => (
            <span key={item.product.id} className="text-sm">
              • {item.product.name}: {item.quantity} un (estoque: {item.product.stock_quantity} un)
            </span>
          ))}
        </div>
      );
      return false;
    }
    
    return true;
  };

  const validateSale = () => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio!");
      return false;
    }

    if (!selectedPaymentMethod) {
      toast.error("Selecione um método de pagamento");
      return false;
    }

    if (!checkStockAvailability()) {
      return false;
    }

    if (total <= 0) {
      toast.error("Total da venda deve ser maior que zero");
      return false;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return false;
    }

    if (!currentStore?.id) {
      toast.error("Nenhuma loja selecionada");
      return false;
    }

    return true;
  };

  /* =========================
     DISCOUNT
  ========================= */
  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput);
    if (!isNaN(value) && value >= 0 && value <= subtotal) {
      setDiscount(value);
      setDiscountDialogOpen(false);
      setDiscountInput("");
      toast.success(`Desconto de R$ ${value.toFixed(2)} aplicado!`);
    } else {
      toast.error("Valor de desconto inválido");
    }
  };

  /* =========================
     FINALIZE SALE
  ========================= */
  const handleFinalizeSale = async () => {
    // Validar antes de prosseguir
    if (!validateSale()) {
      return;
    }

    try {
      console.log('🔍 [PDV] Iniciando venda...', {
        cartItems: cart.length,
        total,
        customer: selectedCustomer?.id,
        paymentMethod: selectedPaymentMethod,
        user: user?.id,
        store: currentStore?.id
      });

      // Preparar dados NO FORMATO CORRETO para o hook useCreateSale
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: getProductPrice(item.product), // ← CORRETO: unit_price
        })),
        customer_id: selectedCustomer?.id || null,
        payment_method: selectedPaymentMethod,
        discount: discount,
        notes: notes || undefined,
      };

      console.log('📤 [PDV] Dados da venda enviados:', saleData);

      // Usar o hook corretamente
      await createSale.mutateAsync(saleData);
      
      // Limpar após venda (o hook já mostra toast de sucesso)
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setNotes("");
      setPaymentDialogOpen(false);
      
      console.log('✅ [PDV] Venda processada com sucesso!');
      
    } catch (error: any) {
      console.error("💣 [PDV] Erro completo na venda:", error);
      // O toast de erro já é mostrado no hook
    }
  };

  /* =========================
     DELIVERY
  ========================= */
  const handleCreateDelivery = async () => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio!");
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error("Informe o endereço de entrega");
      return;
    }

    // Validar venda antes de criar delivery
    if (!validateSale()) {
      return;
    }

    try {
      console.log('🚚 [PDV] Criando entrega...');

      // Primeiro cria a venda CORRETAMENTE
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: getProductPrice(item.product), // ← CORRETO: unit_price
        })),
        customer_id: selectedCustomer?.id || null,
        payment_method: "pix", // Método padrão para delivery
        discount: discount,
        notes: deliveryNotes || notes || undefined,
      };

      const sale = await createSale.mutateAsync(saleData);
      
      console.log('✅ [PDV] Venda criada para entrega:', sale.id);

      // Depois cria a entrega
      await createDelivery.mutateAsync({
        sale_id: sale.id,
        address: deliveryAddress,
        notes: deliveryNotes || null,
      });

      console.log('✅ [PDV] Entrega criada com sucesso!');

      // Limpar tudo
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setNotes("");
      setDeliveryAddress("");
      setDeliveryNotes("");
      setDeliveryDialogOpen(false);
      
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="font-medium">Venda e entrega criadas com sucesso!</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Pedido em rota • Total: R$ {total.toFixed(2)}
          </div>
        </div>
      );
      
    } catch (error) {
      console.error("💣 [PDV] Erro ao criar entrega:", error);
      toast.error("Erro ao criar entrega");
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-wine" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] animate-fade-in">
      {/* PRODUCTS SECTION */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search Bar */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar produto por nome, código ou descrição..."
                className="pl-12 h-14 text-lg rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredProducts.length > 0) {
                    addToCart(filteredProducts[0]);
                  }
                }}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <Card className="flex-1 overflow-hidden glass">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-wine-light" />
                Produtos Disponíveis
              </CardTitle>
              <Badge variant="outline" className="text-wine">
                {products.length} produtos
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto pb-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum produto encontrado
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery 
                    ? `Nenhum resultado para "${searchQuery}"`
                    : "Digite para buscar produtos"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => {
                  const price = getProductPrice(product);
                  const isOnSale = product.promo_price && product.promo_price < product.sale_price;
                  
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className={cn(
                        "group flex flex-col gap-3 p-4 rounded-xl border-2 border-transparent",
                        "bg-card hover:border-wine/50 transition-all duration-200",
                        "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        <Badge 
                          className={cn(
                            "absolute top-2 left-2 text-xs",
                            getCategoryColor(product.category)
                          )}
                        >
                          {getCategoryLabel(product.category)}
                        </Badge>
                        
                        {/* Stock Badge */}
                        <Badge 
                          variant={product.stock_quantity <= product.min_stock ? "destructive" : "outline"}
                          className="absolute top-2 right-2 text-xs"
                        >
                          {product.stock_quantity} un
                        </Badge>
                        
                        {/* Sale Badge */}
                        {isOnSale && (
                          <div className="absolute bottom-2 left-2 bg-wine text-white text-xs font-bold px-2 py-1 rounded-md">
                            PROMO
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 text-left space-y-2">
                        <p className="font-medium text-sm line-clamp-2 group-hover:text-wine transition-colors">
                          {product.name}
                        </p>
                        
                        {/* Price */}
                        <div className="flex items-center gap-2">
                          {isOnSale ? (
                            <>
                              <span className="text-lg font-bold text-gold">
                                R$ {price.toFixed(2)}
                              </span>
                              <span className="text-sm text-muted-foreground line-through">
                                R$ {product.sale_price?.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-foreground">
                              R$ {price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Barcode */}
                        {product.barcode && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <QrCode className="h-3 w-3" />
                            {product.barcode}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CART SECTION */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Customer Info */}
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-wine/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-wine" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">
                    {selectedCustomer?.name || "Consumidor Final"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomerDialogOpen(true)}
              >
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cart Items */}
        <Card className="flex-1 overflow-hidden glass">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-wine-light" />
                Carrinho
                <Badge variant="outline" className="ml-2">
                  {itemCount} itens
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Carrinho vazio
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Adicione produtos para começar uma venda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    {/* Product Image */}
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {getProductPrice(item.product).toFixed(2)} un
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getCategoryLabel(item.product.category)}
                      </Badge>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price & Remove */}
                    <div className="text-right">
                      <p className="font-bold text-gold">
                        R$ {(getProductPrice(item.product) * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals & Actions */}
        <Card className="glass">
          <CardContent className="p-6 space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Desconto:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-wine"
                    onClick={() => setDiscountDialogOpen(true)}
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    {discount > 0 ? `R$ ${discount.toFixed(2)}` : "Adicionar"}
                  </Button>
                </div>
                <span className="font-medium text-wine">
                  -R$ {discount.toFixed(2)}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span className="text-gold">R$ {total.toFixed(2)}</span>
              </div>

              {/* Validação de dados */}
              {(!user?.id || !currentStore?.id) && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                  <p className="text-xs text-amber-800">
                    ⚠️ {!user?.id ? 'Usuário não autenticado' : 'Loja não selecionada'}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre a venda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setDeliveryDialogOpen(true)}
                disabled={cart.length === 0 || !user?.id || !currentStore?.id}
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                Delivery
              </Button>
              
              <Button
                variant="wine"
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0 || !user?.id || !currentStore?.id}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Finalizar Venda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================
         DIALOGS
      ========================= */}

      {/* Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={() => setSelectedCustomer(null)}>
                  <User className="mr-2 h-4 w-4" />
                  Consumidor Final
                </CommandItem>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    onSelect={() => {
                      setSelectedCustomer(customer);
                      setCustomerDialogOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {customer.name}
                    {customer.phone && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {customer.phone}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Desconto</DialogTitle>
            <DialogDescription>
              Valor máximo: R$ {subtotal.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Valor do Desconto (R$)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max={subtotal}
                step="0.01"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleApplyDiscount}>
                Aplicar Desconto
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Total: R$ {total.toFixed(2)}
              {(!user?.id || !currentStore?.id) && (
                <span className="block text-amber-600 text-sm mt-1">
                  ⚠️ {!user?.id ? 'Usuário não autenticado' : 'Loja não selecionada'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={(value: PaymentMethod) => setSelectedPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Dinheiro
                    </div>
                  </SelectItem>
                  <SelectItem value="pix">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      PIX
                    </div>
                  </SelectItem>
                  <SelectItem value="credito">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Crédito
                    </div>
                  </SelectItem>
                  <SelectItem value="debito">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Cartão de Débito
                    </div>
                  </SelectItem>
                  <SelectItem value="vale">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Vale
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleFinalizeSale}
                disabled={createSale.isPending || !user?.id || !currentStore?.id}
                className="w-full sm:w-auto"
              >
                {createSale.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Venda"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Criar Entrega
            </DialogTitle>
            <DialogDescription>
              Total da venda: R$ {total.toFixed(2)}
              {(!user?.id || !currentStore?.id) && (
                <span className="block text-amber-600 text-sm mt-1">
                  ⚠️ {!user?.id ? 'Usuário não autenticado' : 'Loja não selecionada'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço de Entrega *</Label>
              <Textarea
                id="address"
                placeholder="Rua, número, bairro, complemento..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Observações da Entrega (opcional)</Label>
              <Textarea
                id="deliveryNotes"
                placeholder="Instruções para entrega, ponto de referência..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
            
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Atenção</p>
                  <p className="text-xs text-warning/80 mt-1">
                    O pedido será marcado como "em rota" e você poderá acompanhar
                    o status na seção de Delivery.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setDeliveryDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateDelivery}
                disabled={createDelivery.isPending || !deliveryAddress.trim() || !user?.id || !currentStore?.id}
                className="w-full sm:w-auto"
              >
                {createDelivery.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando entrega...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Entrega
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}