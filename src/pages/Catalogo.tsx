import { useState, useEffect } from "react"; 
import { useParams, useNavigate } from "react-router-dom";
import {
  Wine,
  Beer,
  GlassWater,
  Search,
  Plus,
  Filter,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, useDeleteProduct, PRODUCT_CATEGORIES, Product } from "@/hooks/useProducts";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
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

const getCategoryIcon = (category?: string | null) => {
  const c = (category ?? "").toLowerCase();
  if (c.includes("vinho") || c.includes("espumante")) return "🍷";
  if (c.includes("cerveja")) return "🍺";
  if (c.includes("whisky")) return "🥃";
  if (c.includes("gin") || c.includes("vodka")) return "🍸";
  if (c.includes("rum") || c.includes("cachaca") || c.includes("tequila")) return "🥃";
  if (c.includes("refrigerante") || c.includes("suco") || c.includes("agua") || c.includes("energetico")) return "🥤";
  return "📦";
};

const getCategoryGroup = (category?: string | null) => {
  const c = (category ?? "").toLowerCase();
  if (c.includes("vinho") || c.includes("espumante")) return "vinhos";
  if (["vodka", "whisky", "rum", "gin", "tequila", "cachaca", "licor"].some(d => c.includes(d))) return "destilados";
  return "outros";
};

export default function Catalogo() {
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const [activeCategory, setActiveCategory] = useState(urlCategory || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => { if (urlCategory) setActiveCategory(urlCategory); }, [urlCategory]);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === "all") navigate("/catalogo");
    else navigate(`/catalogo/${categoryId}`);
  };

  const categories = [
    { id: "all", name: "Todos", icon: Package, count: products.length },
    { id: "vinhos", name: "Vinhos", icon: Wine, count: products.filter(p => getCategoryGroup(p.category) === "vinhos").length },
    { id: "cervejas", name: "Cervejas", icon: Beer, count: products.filter(p => getCategoryGroup(p.category) === "cervejas").length },
    { id: "destilados", name: "Destilados", icon: GlassWater, count: products.filter(p => getCategoryGroup(p.category) === "destilados").length },
  ];

  const filteredProducts = products.filter((product) => {
    const name = product.name ?? "";
    const category = product.category ?? "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || getCategoryGroup(category) === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => { setEditingProduct(product); setFormOpen(true); };
  const handleDelete = (product: Product) => { setProductToDelete(product); setDeleteDialogOpen(true); };
  const confirmDelete = async () => { if (productToDelete) { await deleteProduct.mutateAsync(productToDelete.id); setDeleteDialogOpen(false); setProductToDelete(null); } };
  const getCategoryLabel = (category: string) => PRODUCT_CATEGORIES.find(c => c.value === category)?.label || category;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Catálogo</h1>
          <p className="text-muted-foreground">Gerencie seus produtos e categorias</p>
        </div>
        <Button variant="wine" className="gap-2" onClick={() => { setEditingProduct(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(category => (
          <Card
            key={category.id}
            variant={activeCategory === category.id ? "wine" : "elevated"}
            className="cursor-pointer transition-all hover:scale-[1.02]"
            onClick={() => handleCategoryChange(category.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${activeCategory === category.id ? "bg-wine-light/20 text-wine-light" : "bg-secondary text-muted-foreground"}`}>
                <category.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">{category.count} produtos</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar produtos..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Relevância</SelectItem>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                  <SelectItem value="price-asc">Menor Preço</SelectItem>
                  <SelectItem value="price-desc">Maior Preço</SelectItem>
                  <SelectItem value="stock">Estoque</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
              <div className="flex border rounded-lg overflow-hidden">
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}><Grid className="h-4 w-4" /></Button>
                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">{searchQuery ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro produto"}</p>
            <Button variant="wine" onClick={() => { setEditingProduct(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Cadastrar Produto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-3"}>
          {filteredProducts.map(product => {
            const isPromo = product.promo_price != null;
            const displayPrice = isPromo ? product.promo_price : product.sale_price ?? product.price ?? 0;

            return (
              <Card key={product.id} variant="elevated" className="group hover:border-wine/30 transition-all relative">
                {/* Badge de Promoção */}
                {isPromo && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded z-10">
                    Promoção
                  </div>
                )}

                <CardContent className={viewMode === "grid" ? "p-4" : "p-4 flex items-center gap-4"}>
                  {/* Image */}
                  <div className={`flex items-center justify-center rounded-xl bg-secondary overflow-hidden ${viewMode === "grid" ? "h-32 mb-4" : "h-16 w-16 shrink-0"}`}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    ) : null}
                    <span className={`${product.image_url ? "hidden" : ""} ${viewMode === "grid" ? "text-5xl" : "text-3xl"}`}>{getCategoryIcon(product.category)}</span>
                  </div>

                  {/* Info */}
                  <div className={viewMode === "grid" ? "" : "flex-1"}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium line-clamp-1">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{getCategoryLabel(product.category)}</Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product)}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-end justify-between mt-3">
                      <div>
                        {isPromo ? (
                          <>
                            <p className="text-sm text-gray-400 line-through">R$ {(product.sale_price ?? product.price ?? 0).toFixed(2)}</p>
                            <p className="text-2xl font-bold text-red-600">R$ {displayPrice.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-gold">R$ {displayPrice.toFixed(2)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Custo: R$ {(product.cost_price ?? 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${product.stock_quantity <= product.min_stock ? "text-destructive" : "text-muted-foreground"}`}>{product.stock_quantity} un.</p>
                        <p className="text-xs text-muted-foreground">em estoque</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editingProduct} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.name}"? Esta ação não pode ser desfeita.
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
    </div>
  );
}
