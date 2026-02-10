import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Star,
  Gift,
  TrendingUp,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Crown,
  Send,
  Package,
  Percent,
  X,
  DollarSign,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useCustomers, 
  useDeleteCustomer, 
  useBirthdayCustomers,
  useUpdateCustomer,
  Customer 
} from "@/hooks/useCustomers";
import { useProducts, Product } from "@/hooks/useProducts";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCurrentStore } from "@/hooks/useStores";

const getTierFromPoints = (points: number) => {
  if (points >= 2000) return { tier: "Diamond", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" };
  if (points >= 1000) return { tier: "Gold", color: "bg-gold/20 text-gold border-gold/30" };
  if (points >= 500) return { tier: "Silver", color: "bg-slate-400/20 text-slate-300 border-slate-400/30" };
  return { tier: "Bronze", color: "bg-amber-700/20 text-amber-600 border-amber-700/30" };
};

interface BirthdayMessageData {
  customerId: string;
  customerName: string;
  phone: string;
  message: string;
  productId: string;
  productName: string;
  productDescription: string;
  productPrice: number;
  originalPrice: number;
  productImage: string;
  discount: string;
  isPromo: boolean;
}

export default function Clientes() {
  const { data: customers = [], isLoading } = useCustomers();
  const { data: birthdayCustomers = [] } = useBirthdayCustomers();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const currentStore = useCurrentStore();
  const deleteCustomer = useDeleteCustomer();
  const updateCustomer = useUpdateCustomer();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [birthdayMessageOpen, setBirthdayMessageOpen] = useState(false);
  const [birthdayMessageData, setBirthdayMessageData] = useState<BirthdayMessageData>({
  customerId: "",
  customerName: "",
  phone: "",
  message: `Olá!\n\nNós da ${currentStore?.name || "Adega"} sabemos que nesse mês o parabéns é para você!\n\nSeparamos um presentão para essa data especial! 🎁🎉`,
  productId: "",
  productName: "",
  productDescription: "",
  productPrice: 0,
  originalPrice: 0,
  productImage: "",
  discount: "20%",
  isPromo: false,
});

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const vipCount = customers.filter(c => c.loyalty_points >= 1000).length;

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleToggleVIP = async (customer: Customer) => {
    const isVIP = customer.loyalty_points >= 1000;
    const newPoints = isVIP ? 0 : 1000;
    
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        updates: { loyalty_points: newPoints }
      });
    } catch (error) {
      console.error("Erro ao alterar status VIP:", error);
    }
  };

  const handleSendBirthdayMessage = (customer: Customer) => {
  if (!customer.phone) {
    alert("Cliente não possui telefone cadastrado!");
    return;
  }

  // Encontrar um produto com preço válido
  const validProduct = products.find(p => {
    // Usar promo_price se existir, senão sale_price
    const price = p.promo_price || p.sale_price;
    return price && Number(price) > 0;
  }) || products[0];
  
  // USAR PROMO_PRICE SE EXISTIR, SENÃO SALE_PRICE
  const activePrice = validProduct?.promo_price || validProduct?.sale_price || 0;
  const productPrice = Number(activePrice);
  const originalPrice = validProduct?.sale_price || 0;
  const isPromo = validProduct ? (validProduct.promo_price !== null && validProduct.promo_price > 0) : false;
  
  setBirthdayMessageData({
    customerId: customer.id,
    customerName: customer.name,
    phone: customer.phone,
    message: `Olá!\n\nNós da ${currentStore?.name || "Adega"} sabemos que nesse mês o parabéns é para você!\n\nSeparamos um presentão para essa data especial! 🎁🎉`,
    productId: validProduct?.id || "",
    productName: validProduct?.name || "Presente Especial",
    productDescription: validProduct?.description || "Uma seleção especial para celebrar seu dia!",
    productPrice: productPrice,
    originalPrice: Number(originalPrice),
    productImage: validProduct?.image_url || "",
    discount: "20%",
    isPromo: isPromo,
  });
  setBirthdayMessageOpen(true);
};

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    
    if (selectedProduct) {
      // USAR PROMO_PRICE SE EXISTIR, SENÃO SALE_PRICE
      const activePrice = selectedProduct.promo_price || selectedProduct.sale_price || 0;
      const productPrice = Number(activePrice);
      const originalPrice = selectedProduct.sale_price || 0;
      const isPromo = selectedProduct.promo_price !== null && selectedProduct.promo_price > 0;
      
      setBirthdayMessageData(prev => ({
        ...prev,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productDescription: selectedProduct.description || "Uma seleção especial para celebrar seu dia!",
        productPrice: productPrice,
        originalPrice: Number(originalPrice),
        productImage: selectedProduct.image_url || "",
        isPromo: isPromo,
      }));
    }
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      await deleteCustomer.mutateAsync(customerToDelete.id);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const sendWhatsAppMessage = () => {
  const { phone, message, productName, discount, productPrice, originalPrice, isPromo } = birthdayMessageData;
  
  if (productPrice === 0) {
    alert("Atenção! O produto selecionado tem preço zero. Verifique o cadastro do produto.");
    return;
  }
  
  // Formata o telefone (remove caracteres não numéricos)
  const formattedPhone = phone.replace(/\D/g, '');
  
  // Calcula o preço com desconto adicional do aniversário
  const birthdayDiscountPercentage = parseInt(discount.replace('%', '')) || 0;
  const finalPrice = productPrice * (1 - birthdayDiscountPercentage / 100);
  
  // Calcula o desconto total em relação ao preço original (sale_price)
  let totalDiscountPercentage = 0;
  
  if (isPromo && originalPrice > 0) {
    // Se tem promoção, calcula o desconto total em relação ao sale_price
    totalDiscountPercentage = Math.round((1 - finalPrice / originalPrice) * 100);
  } else if (birthdayDiscountPercentage > 0) {
    // Se não tem promoção, usa apenas o desconto de aniversário
    totalDiscountPercentage = birthdayDiscountPercentage;
  }
  
  // Cria a mensagem completa com emojis Unicode
  let fullMessage = `${message}\n\n`;
  fullMessage += `🎁 *Presente Especial:* ${productName}\n`;
  
  if (isPromo && originalPrice > 0) {
    fullMessage += `🏷️ *Preço em Promoção:* R$ ${productPrice.toFixed(2)}\n`;
    fullMessage += `💰 *Preço Original:* R$ ${originalPrice.toFixed(2)}\n`;
    fullMessage += `✨ *Com Desconto de Aniversário ${discount}:* R$ ${finalPrice.toFixed(2)}\n`;
    fullMessage += `🎉 *Desconto Total:* ${totalDiscountPercentage}% OFF\n\n`;
  } else {
    if (isPromo) {
      fullMessage += `🏷️ *Preço Promocional:* R$ ${productPrice.toFixed(2)}\n`;
    } else {
      fullMessage += `💰 *Preço:* R$ ${productPrice.toFixed(2)}\n`;
    }
    if (birthdayDiscountPercentage > 0) {
      fullMessage += `✨ *Com Desconto de ${discount}:* R$ ${finalPrice.toFixed(2)}\n`;
    }
    fullMessage += `\n`;
  }
  
  fullMessage += `🎉 *Feliz Aniversário!* 🎉`;
  
  // Usar URL correta do WhatsApp
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullMessage)}`;
  
  // Abre em uma nova aba
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  
  // Fecha o modal
  setBirthdayMessageOpen(false);
};

  const formatBirthday = (date: string | null) => {
    if (!date) return null;
    try {
      return format(parseISO(date), "dd/MM", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, date);
      const parts = date.split('-');
      if (parts.length >= 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
      }
      return "Data inválida";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de clientes e programa de fidelidade
          </p>
        </div>
        <Button variant="wine" className="gap-2" onClick={() => { setEditingCustomer(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-wine/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-wine-light" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes VIP</p>
                <p className="text-2xl font-bold">{vipCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos (mês)</p>
                <p className="text-2xl font-bold">
                  +{customers.filter(c => {
                    const created = new Date(c.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <Gift className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aniversariantes</p>
                <p className="text-2xl font-bold">{birthdayCustomers.length} este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customers Table */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const { tier, color } = getTierFromPoints(customer.loyalty_points);
                    const isVIP = customer.loyalty_points >= 1000;
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-wine/20 text-wine-light">
                                {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {customer.email || "Sem e-mail"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={color}>
                            {tier}
                            {isVIP && <Star className="h-3 w-3 ml-1 inline" />}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.phone || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-gold" />
                            <span className="font-medium">{customer.loyalty_points}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleVIP(customer)}
                                className={isVIP ? "text-destructive" : "text-gold"}
                              >
                                {isVIP ? (
                                  <>
                                    <X className="h-4 w-4 mr-2" />
                                    Remover VIP
                                  </>
                                ) : (
                                  <>
                                    <Crown className="h-4 w-4 mr-2" />
                                    Tornar VIP
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(customer)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Birthdays */}
        <Card variant="gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Aniversariantes do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {birthdayCustomers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum aniversariante este mês
                </p>
              ) : (
                birthdayCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-gold/20 text-gold">
                        {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{customer.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatBirthday(customer.birth_date)}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSendBirthdayMessage(customer)}
                      disabled={loadingProducts}
                    >
                      <Gift className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CustomerFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        customer={editingCustomer} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{customerToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Birthday Message Dialog */}
      <Dialog open={birthdayMessageOpen} onOpenChange={setBirthdayMessageOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem de Aniversário</DialogTitle>
            <DialogDescription>
              Envie uma mensagem especial para {birthdayMessageData.customerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview da Mensagem */}
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Preview da Mensagem:
              </h4>
              <p className="text-sm whitespace-pre-line mb-3">{birthdayMessageData.message}</p>
              
              <div className="p-3 bg-card rounded border">
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    {birthdayMessageData.productImage ? (
                      <img 
                        src={birthdayMessageData.productImage} 
                        alt={birthdayMessageData.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<Package className="h-8 w-8 text-muted-foreground" />';
                        }}
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{birthdayMessageData.productName}</p>
                      {birthdayMessageData.isPromo && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Tag className="h-3 w-3 mr-1" />
                          Promoção
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {birthdayMessageData.productDescription}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {birthdayMessageData.isPromo && birthdayMessageData.originalPrice > 0 && (
                        <span className="text-sm line-through opacity-60 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {birthdayMessageData.originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className={`text-sm flex items-center gap-1 ${birthdayMessageData.isPromo ? 'text-green-600 font-semibold' : 'opacity-60'}`}>
                        <DollarSign className="h-3 w-3" />
                        R$ {birthdayMessageData.productPrice.toFixed(2)}
                        {birthdayMessageData.isPromo && ' (Promo)'}
                      </span>
                      <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        R$ {(birthdayMessageData.productPrice * (1 - (parseInt(birthdayMessageData.discount.replace('%', '')) || 0) / 100)).toFixed(2)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {birthdayMessageData.discount} OFF
                      </Badge>
                    </div>
                    {birthdayMessageData.isPromo && birthdayMessageData.originalPrice > 0 && (
                      <div className="mt-1 text-xs text-orange-600">
                        Desconto total: {Math.round((1 - (birthdayMessageData.productPrice * (1 - (parseInt(birthdayMessageData.discount.replace('%', '')) || 0) / 100)) / birthdayMessageData.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Alerta se o preço for zero */}
              {birthdayMessageData.productPrice === 0 && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        Atenção: Produto sem preço cadastrado
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Este produto está com preço zero. Verifique o cadastro do produto antes de enviar.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campos Editáveis */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem Personalizada</Label>
                <Textarea
                  id="message"
                  value={birthdayMessageData.message}
                  onChange={(e) => setBirthdayMessageData({
                    ...birthdayMessageData,
                    message: e.target.value
                  })}
                  rows={4}
                  placeholder="Digite a mensagem de aniversário..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Selecionar Produto
                  </Label>
                  <Select
                    value={birthdayMessageData.productId}
                    onValueChange={handleProductChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto">
                        {birthdayMessageData.productName} 
                        {birthdayMessageData.productPrice > 0 && ` - R$ ${birthdayMessageData.productPrice.toFixed(2)}`}
                        {birthdayMessageData.isPromo && ' 🏷️'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProducts ? (
                        <SelectItem value="" disabled>
                          Carregando produtos...
                        </SelectItem>
                      ) : products.length === 0 ? (
                        <SelectItem value="" disabled>
                          Nenhum produto cadastrado
                        </SelectItem>
                      ) : (
                        products.map((product) => {
                          // USAR PROMO_PRICE SE EXISTIR, SENÃO SALE_PRICE
                          const activePrice = product.promo_price || product.sale_price || 0;
                          const price = Number(activePrice);
                          const isPromo = product.promo_price !== null && product.promo_price > 0;
                          
                          return (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className="truncate">{product.name}</span>
                                  {isPromo && <Badge variant="outline" className="h-5 text-xs bg-orange-50 text-orange-700 border-orange-200">
                                    <Tag className="h-3 w-3 mr-1" />
                                    Promo
                                  </Badge>}
                                </div>
                                <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
                                  R$ {price.toFixed(2)}
                                  {isPromo && ' 🏷️'}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {products.length} produto{products.length !== 1 ? 's' : ''} disponível{products.length !== 1 ? 'is' : ''}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Desconto de Aniversário
                  </Label>
                  <Select
                    value={birthdayMessageData.discount}
                    onValueChange={(value) => setBirthdayMessageData({
                      ...birthdayMessageData,
                      discount: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o desconto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10%">10%</SelectItem>
                      <SelectItem value="15%">15%</SelectItem>
                      <SelectItem value="20%">20%</SelectItem>
                      <SelectItem value="25%">25%</SelectItem>
                      <SelectItem value="30%">30%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBirthdayMessageOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={sendWhatsAppMessage}
              className="gap-2 bg-green-600 hover:bg-green-700"
              disabled={birthdayMessageData.productPrice === 0}
            >
              <Send className="h-4 w-4" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}