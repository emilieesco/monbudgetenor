import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { ShoppingCart, AlertCircle, CheckCircle2, ArrowLeft, TrendingUp, Plus, Minus, Trash2, Receipt, X } from "lucide-react";
import type { CatalogItem, Student } from "@shared/schema";

const QUEBEC_TAX_RATE = 0.14975; // TPS 5% + TVQ 9.975%

const CATEGORIES = [
  { id: "food", name: "Nourriture", icon: "🍎", color: "from-green-500 to-emerald-600" },
  { id: "clothing", name: "Vêtements", icon: "👕", color: "from-blue-500 to-indigo-600" },
  { id: "leisure", name: "Loisirs", icon: "🎮", color: "from-purple-500 to-violet-600" },
];

const FOOD_SUBCATEGORIES = [
  { id: "Produits Laitiers", icon: "🥛", color: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "Viandes", icon: "🍗", color: "bg-red-100 dark:bg-red-900/30" },
  { id: "Fruits & Légumes", icon: "🥬", color: "bg-green-100 dark:bg-green-900/30" },
  { id: "Conserves", icon: "🥫", color: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "Boulangerie", icon: "🍞", color: "bg-orange-100 dark:bg-orange-900/30" },
  { id: "Bonbons & Sucreries", icon: "🍬", color: "bg-pink-100 dark:bg-pink-900/30" },
  { id: "Boissons", icon: "🥤", color: "bg-cyan-100 dark:bg-cyan-900/30" },
];

const ITEMS_PER_PAGE = 12;

interface CartItem {
  item: CatalogItem;
  quantity: number;
}

function getProductEmoji(name: string, category: string): string {
  const lower = name.toLowerCase();
  
  if (category === "food") {
    if (lower.includes("lait")) return "🥛";
    if (lower.includes("pain")) return "🍞";
    if (lower.includes("œuf") || lower.includes("oeuf")) return "🥚";
    if (lower.includes("poulet")) return "🍗";
    if (lower.includes("bœuf") || lower.includes("boeuf") || lower.includes("steak")) return "🥩";
    if (lower.includes("fromage") || lower.includes("cheddar") || lower.includes("mozzarella")) return "🧀";
    if (lower.includes("riz")) return "🍚";
    if (lower.includes("pâte") || lower.includes("spaghetti")) return "🍝";
    if (lower.includes("banane")) return "🍌";
    if (lower.includes("pomme") && !lower.includes("terre")) return "🍎";
    if (lower.includes("orange")) return "🍊";
    if (lower.includes("carotte")) return "🥕";
    if (lower.includes("brocoli")) return "🥦";
    if (lower.includes("tomate")) return "🍅";
    if (lower.includes("salade") || lower.includes("laitue")) return "🥬";
    if (lower.includes("pomme de terre") || lower.includes("patate")) return "🥔";
    if (lower.includes("oignon")) return "🧅";
    if (lower.includes("chips") || lower.includes("doritos")) return "🥔";
    if (lower.includes("chocolat")) return "🍫";
    if (lower.includes("bonbon") || lower.includes("gélifié")) return "🍬";
    if (lower.includes("biscuit") || lower.includes("oreo")) return "🍪";
    if (lower.includes("crème glacée")) return "🍦";
    if (lower.includes("popcorn")) return "🍿";
    if (lower.includes("yaourt") || lower.includes("yogourt")) return "🥛";
    if (lower.includes("beurre")) return "🧈";
    if (lower.includes("crème")) return "🥛";
    if (lower.includes("jus")) return "🧃";
    if (lower.includes("soda") || lower.includes("pepsi") || lower.includes("coca")) return "🥤";
    if (lower.includes("eau")) return "💧";
    if (lower.includes("café")) return "☕";
    if (lower.includes("thé")) return "🍵";
    if (lower.includes("gatorade")) return "🧴";
    if (lower.includes("saumon") || lower.includes("poisson") || lower.includes("truite")) return "🐟";
    if (lower.includes("crevette")) return "🦐";
    if (lower.includes("bacon")) return "🥓";
    if (lower.includes("porc") || lower.includes("côtelette")) return "🥩";
    if (lower.includes("bagel")) return "🥯";
    if (lower.includes("croissant")) return "🥐";
    if (lower.includes("tortilla")) return "🌯";
    if (lower.includes("muffin")) return "🧁";
    if (lower.includes("soupe")) return "🥣";
    if (lower.includes("thon")) return "🐟";
    if (lower.includes("maïs")) return "🌽";
    if (lower.includes("haricot")) return "🫘";
    if (lower.includes("barre")) return "🍫";
    return "🍽️";
  }
  
  if (category === "clothing") {
    if (lower.includes("t-shirt")) return "👕";
    if (lower.includes("jeans")) return "👖";
    if (lower.includes("chaussure")) return "👟";
    if (lower.includes("chaussette")) return "🧦";
    if (lower.includes("veste")) return "🧥";
    if (lower.includes("pull")) return "🧶";
    if (lower.includes("bermuda")) return "🩳";
    return "👕";
  }
  
  if (category === "leisure") {
    if (lower.includes("cinéma")) return "🎬";
    if (lower.includes("jeu")) return "🎮";
    if (lower.includes("piscine")) return "🏊";
    if (lower.includes("café")) return "☕";
    if (lower.includes("livre")) return "📚";
    if (lower.includes("concert")) return "🎵";
    return "🎮";
  }
  
  return "🛒";
}

export default function Catalog() {
  const { studentId } = useParams();
  const [location, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const cat = params.get("category");
    if (cat === "food" || cat === "clothing" || cat === "leisure") {
      setSelectedCategory(cat);
    }
  }, [location]);

  const studentQuery = useQuery({
    queryKey: ["/api/students", studentId],
  });

  const catalogQuery = useQuery({
    queryKey: ["/api/catalog"],
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (cartItems: CartItem[]) => {
      const promises = cartItems.flatMap(cartItem => {
        const priceWithTax = cartItem.item.isTaxable 
          ? cartItem.item.price * (1 + QUEBEC_TAX_RATE) 
          : cartItem.item.price;
        const roundedPrice = Math.round(priceWithTax * 100) / 100;
        
        return Array.from({ length: cartItem.quantity }, () => 
          apiRequest("POST", "/api/expenses", {
            studentId,
            itemId: cartItem.item.id,
            amount: roundedPrice,
            category: cartItem.item.category,
            isEssential: cartItem.item.isEssential,
          })
        );
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", studentId] });
      setCart([]);
      setShowCheckoutConfirm(false);
      setIsCartOpen(false);
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 3000);
    },
  });

  const student = studentQuery.data as Student | undefined;
  const allItems = catalogQuery.data as CatalogItem[] || [];
  let filteredItems = allItems.filter(item => item.category === selectedCategory);
  
  if (selectedCategory === "food" && selectedSubcategory) {
    filteredItems = filteredItems.filter(item => item.subcategory === selectedSubcategory);
  }
  
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const items = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
  
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory(null);
    setCurrentPage(1);
  };
  
  const handleSubcategoryChange = (subcat: string | null) => {
    setSelectedSubcategory(subcat);
    setCurrentPage(1);
  };

  const addToCart = (item: CatalogItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => 
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  // Calculate cart totals with Quebec taxes
  const calculateCartTotals = () => {
    let subtotal = 0;
    let taxableAmount = 0;
    
    cart.forEach(cartItem => {
      const itemTotal = cartItem.item.price * cartItem.quantity;
      subtotal += itemTotal;
      if (cartItem.item.isTaxable) {
        taxableAmount += itemTotal;
      }
    });
    
    const taxes = taxableAmount * QUEBEC_TAX_RATE;
    const total = subtotal + taxes;
    
    return { subtotal, taxableAmount, taxes, total };
  };

  const cartTotals = calculateCartTotals();
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (!student) {
    return <div className="p-8">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const canAffordCart = remaining >= cartTotals.total;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      {/* Success Toast */}
      {purchaseSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <p className="font-bold">Achat complété!</p>
              <p className="text-sm opacity-90">Votre panier a été validé</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${currentCategory?.color} text-white p-6 md:p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-5xl font-black mb-2">Circulaire Mon Budget en Or</h1>
              <p className="text-white/90 text-base md:text-lg">Découvrez nos meilleures offres de la semaine!</p>
            </div>
            <div className="flex items-center gap-3">
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="relative flex items-center gap-2 font-bold"
                    data-testid="button-open-cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="hidden sm:inline">Panier</span>
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-0 min-w-[24px] h-6 flex items-center justify-center">
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-xl">
                      <ShoppingCart className="w-6 h-6" />
                      Mon Panier ({cartItemCount} articles)
                    </SheetTitle>
                    <SheetDescription>
                      Vérifiez vos achats avant de payer
                    </SheetDescription>
                  </SheetHeader>
                  
                  {cart.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Votre panier est vide</p>
                        <p className="text-sm">Ajoutez des articles pour commencer</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="flex-1 -mx-6 px-6">
                        <div className="space-y-3 py-4">
                          {cart.map(cartItem => (
                            <Card key={cartItem.item.id} className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl">
                                  {getProductEmoji(cartItem.item.name, cartItem.item.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate">{cartItem.item.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-primary font-bold">
                                      ${cartItem.item.price.toFixed(2)}
                                    </span>
                                    {cartItem.item.isTaxable && (
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        +taxe
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(cartItem.item.id, -1)}
                                    data-testid={`button-decrease-${cartItem.item.id}`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-8 text-center font-bold">{cartItem.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(cartItem.item.id, 1)}
                                    data-testid={`button-increase-${cartItem.item.id}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => removeFromCart(cartItem.item.id)}
                                    data-testid={`button-remove-${cartItem.item.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Cart Summary - Receipt Style */}
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 font-mono text-sm">
                          <div className="text-center border-b pb-2 mb-2">
                            <Receipt className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-bold text-base">REÇU DE CAISSE</p>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Sous-total:</span>
                            <span>${cartTotals.subtotal.toFixed(2)}</span>
                          </div>
                          
                          {cartTotals.taxableAmount > 0 && (
                            <>
                              <div className="flex justify-between text-muted-foreground text-xs">
                                <span>Articles taxables:</span>
                                <span>${cartTotals.taxableAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>TPS + TVQ (14.975%):</span>
                                <span>${cartTotals.taxes.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          
                          <Separator />
                          
                          <div className="flex justify-between font-bold text-lg">
                            <span>TOTAL:</span>
                            <span className="text-primary">${cartTotals.total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-sm px-1">
                          <span>Budget disponible:</span>
                          <span className={`font-bold ${remaining < 0 ? "text-destructive" : "text-green-600"}`}>
                            ${remaining.toFixed(2)}
                          </span>
                        </div>

                        {!canAffordCart && (
                          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            <p className="text-sm text-destructive font-semibold">
                              Budget insuffisant! Il vous manque ${(cartTotals.total - remaining).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      <SheetFooter className="mt-4">
                        <Button
                          className="w-full font-bold text-lg py-6"
                          size="lg"
                          disabled={!canAffordCart || addExpenseMutation.isPending || cart.length === 0}
                          onClick={() => setShowCheckoutConfirm(true)}
                          data-testid="button-checkout"
                        >
                          {addExpenseMutation.isPending ? "Traitement..." : `Payer ${cartTotals.total.toFixed(2)}$`}
                        </Button>
                      </SheetFooter>
                    </>
                  )}
                </SheetContent>
              </Sheet>

              <Button
                onClick={() => navigate(`/student/${studentId}`)}
                variant="secondary"
                className="flex items-center gap-2"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Retour</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="bg-white/20 px-4 py-2 rounded-full">
              Budget restant: <strong className={`ml-1 ${remaining < 0 ? "text-red-300" : "text-green-100"}`}>${remaining.toFixed(2)}</strong>
            </div>
            {cartItemCount > 0 && (
              <div className="bg-white/20 px-4 py-2 rounded-full">
                Dans le panier: <strong className="ml-1">${cartTotals.total.toFixed(2)}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Category Navigation */}
        <div className="flex gap-3 my-8 justify-center flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => handleCategoryChange(cat.id)}
              className="px-6 md:px-8 py-6 text-base md:text-lg flex items-center gap-2 md:gap-3 font-semibold"
              size="lg"
              data-testid={`button-category-${cat.id}`}
            >
              <span className="text-xl md:text-2xl">{cat.icon}</span>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Subcategory Navigation for Food - Circular Style */}
        {selectedCategory === "food" && (
          <div className="mb-8">
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                variant={selectedSubcategory === null ? "default" : "outline"}
                onClick={() => handleSubcategoryChange(null)}
                className="px-4 py-2"
                data-testid="button-subcategory-all"
              >
                🛒 Tous les produits
              </Button>
              {FOOD_SUBCATEGORIES.map(subcat => (
                <Button
                  key={subcat.id}
                  variant={selectedSubcategory === subcat.id ? "default" : "outline"}
                  onClick={() => handleSubcategoryChange(subcat.id)}
                  className="px-4 py-2"
                  data-testid={`button-subcategory-${subcat.id}`}
                >
                  <span className="mr-1">{subcat.icon}</span>
                  {subcat.id}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid - Flyer Style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {items.map(item => {
            const isEssential = item.isEssential;
            const isTaxable = item.isTaxable;
            const cartItem = cart.find(c => c.item.id === item.id);
            
            return (
              <Card
                key={item.id}
                className="overflow-hidden border-2 hover:border-primary transition-all hover-elevate group relative"
                data-testid={`card-product-${item.id}`}
              >
                {/* Tax indicator */}
                {isTaxable && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">
                      +taxe
                    </Badge>
                  </div>
                )}

                {/* Cart quantity indicator */}
                {cartItem && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-primary text-white border-0 min-w-[24px] h-6 flex items-center justify-center">
                      {cartItem.quantity}
                    </Badge>
                  </div>
                )}

                {/* Product Image/Icon Area */}
                <div className="h-20 md:h-24 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center border-b">
                  <div className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">
                    {getProductEmoji(item.name, item.category)}
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-2 md:p-3">
                  <h3 className="font-bold text-xs md:text-sm line-clamp-2 h-8 md:h-10 text-foreground">{item.name}</h3>
                  
                  {/* Essential/Non-essential badge */}
                  <div className="mt-1 mb-2">
                    <Badge 
                      variant={isEssential ? "default" : "secondary"}
                      className={`text-[10px] ${isEssential ? "bg-green-500 hover:bg-green-500" : "bg-amber-500 hover:bg-amber-500 text-white"}`}
                    >
                      {isEssential ? "Essentiel" : "Plaisir"}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl md:text-2xl font-black text-primary">${item.price.toFixed(2)}</span>
                  </div>

                  {/* Add to cart button */}
                  <Button
                    onClick={() => addToCart(item)}
                    className="w-full font-bold text-xs md:text-sm py-2"
                    size="sm"
                    data-testid={`button-add-${item.id}`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed">
            <p className="text-lg text-muted-foreground">Aucun article dans cette catégorie</p>
          </Card>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 md:gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              Précédent
            </Button>
            <div className="flex gap-1 md:gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  size="sm"
                  data-testid={`button-page-${page}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              Suivant
            </Button>
            <span className="text-muted-foreground text-sm">
              Page {currentPage}/{totalPages}
            </span>
          </div>
        )}

        {/* Tax Info Banner */}
        <Card className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-blue-800 dark:text-blue-200">Taxes du Québec (TPS + TVQ)</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Les produits alimentaires de base (lait, pain, viandes, fruits, légumes) ne sont <strong>pas taxés</strong>.
                Les bonbons, chips, sodas et autres produits non essentiels sont taxés à <strong>14.975%</strong>.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Cart Button for Mobile */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden z-40">
          <Button
            size="lg"
            className="rounded-full w-16 h-16 shadow-lg"
            onClick={() => setIsCartOpen(true)}
            data-testid="button-floating-cart"
          >
            <ShoppingCart className="w-6 h-6" />
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-0 min-w-[24px] h-6">
              {cartItemCount}
            </Badge>
          </Button>
        </div>
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Confirmer l'achat
            </DialogTitle>
            <DialogDescription>
              Vérifiez votre commande avant de payer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 font-mono text-sm max-h-48 overflow-auto">
              {cart.map(cartItem => (
                <div key={cartItem.item.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1">{cartItem.quantity}x {cartItem.item.name}</span>
                  <span className="ml-2">${(cartItem.item.price * cartItem.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>${cartTotals.subtotal.toFixed(2)}</span>
              </div>
              {cartTotals.taxes > 0 && (
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Taxes (TPS + TVQ):</span>
                  <span>${cartTotals.taxes.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total à payer:</span>
                <span className="text-primary">${cartTotals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Budget check */}
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span>Après l'achat:</span>
              <span className={`font-bold ${(remaining - cartTotals.total) < 0 ? "text-destructive" : "text-green-600"}`}>
                ${(remaining - cartTotals.total).toFixed(2)}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCheckoutConfirm(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => addExpenseMutation.mutate(cart)}
              disabled={!canAffordCart || addExpenseMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-confirm-purchase"
            >
              {addExpenseMutation.isPending ? "Traitement..." : "Confirmer l'achat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
