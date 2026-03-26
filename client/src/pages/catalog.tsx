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
import { ShoppingCart, AlertCircle, CheckCircle2, ArrowLeft, Plus, Minus, Trash2, Receipt, Leaf, Star, Tag } from "lucide-react";
import type { CatalogItem, Student } from "@shared/schema";

const QUEBEC_TAX_RATE = 0.14975;

const CATEGORIES = [
  { id: "food", name: "Épicerie", icon: "🛒", color: "bg-red-700", accent: "bg-red-600" },
  { id: "clothing", name: "Vêtements", icon: "👕", color: "bg-blue-700", accent: "bg-blue-600" },
  { id: "leisure", name: "Loisirs", icon: "🎮", color: "bg-purple-700", accent: "bg-purple-600" },
];

const FOOD_SUBCATEGORIES = [
  { id: "Produits Laitiers", icon: "🥛" },
  { id: "Viandes", icon: "🍗" },
  { id: "Fruits & Légumes", icon: "🥬" },
  { id: "Conserves", icon: "🥫" },
  { id: "Boulangerie", icon: "🍞" },
  { id: "Bonbons & Sucreries", icon: "🍬" },
  { id: "Boissons", icon: "🥤" },
];

const ITEMS_PER_PAGE = 18;

interface CartItem {
  item: CatalogItem;
  quantity: number;
}

function getProductEmoji(name: string, category: string): string {
  const n = name.toLowerCase();

  if (category === "food") {
    // === Produits Laitiers ===
    if (n.includes("lait au chocolat")) return "🍫";
    if (n.includes("lait")) return "🥛";
    if (n.includes("yogourt aux fruits")) return "🍓";
    if (n.includes("yogourt") || n.includes("yaourt")) return "🥣";
    if (n.includes("brie")) return "🧀";
    if (n.includes("parmesan")) return "🧀";
    if (n.includes("mozzarella")) return "🧀";
    if (n.includes("cheddar")) return "🧀";
    if (n.includes("cottage")) return "🧀";
    if (n.includes("fromage en grains")) return "🧀";
    if (n.includes("fromage")) return "🧀";
    if (n.includes("beurre")) return "🧈";
    if (n.includes("crème sure")) return "🥛";
    if (n.includes("crème 35") || n.includes("crème glacée")) return "🍦";
    if (n.includes("crème")) return "🥛";

    // === Viandes & Protéines ===
    if (n.includes("œuf") || n.includes("oeuf")) return "🥚";
    if (n.includes("bacon")) return "🥓";
    if (n.includes("saumon")) return "🐟";
    if (n.includes("tilapia")) return "🐟";
    if (n.includes("crevette")) return "🦐";
    if (n.includes("dinde")) return "🦃";
    if (n.includes("saucisse")) return "🌭";
    if (n.includes("jambon")) return "🥩";
    if (n.includes("pepperoni")) return "🍕";
    if (n.includes("tofu")) return "🫘";
    if (n.includes("poulet")) return "🍗";
    if (n.includes("bœuf") || n.includes("boeuf") || n.includes("steak")) return "🥩";
    if (n.includes("porc") || n.includes("côtelette")) return "🥩";
    if (n.includes("poitrines")) return "🍗";

    // === Fruits & Légumes ===
    if (n.includes("banane")) return "🍌";
    if (n.includes("pomme de terre") || n.includes("patate")) return "🥔";
    if (n.includes("pomme")) return "🍎";
    if (n.includes("orange")) return "🍊";
    if (n.includes("fraise")) return "🍓";
    if (n.includes("bleuet")) return "🫐";
    if (n.includes("raisin")) return "🍇";
    if (n.includes("mangue")) return "🥭";
    if (n.includes("pêche")) return "🍑";
    if (n.includes("avocat")) return "🥑";
    if (n.includes("citron")) return "🍋";
    if (n.includes("tomate")) return "🍅";
    if (n.includes("carotte")) return "🥕";
    if (n.includes("brocoli")) return "🥦";
    if (n.includes("chou-fleur")) return "🥦";
    if (n.includes("laitue") || n.includes("romaine") || n.includes("épinard")) return "🥬";
    if (n.includes("concombre") || n.includes("courgette")) return "🥒";
    if (n.includes("poivron")) return "🫑";
    if (n.includes("champignon")) return "🍄";
    if (n.includes("ail")) return "🧄";
    if (n.includes("oignon")) return "🧅";
    if (n.includes("céleri")) return "🌿";

    // === Conserves & Épicerie ===
    if (n.includes("spaghetti") || n.includes("macaroni") || n.includes("pâtes")) return "🍝";
    if (n.includes("riz")) return "🍚";
    if (n.includes("soupe")) return "🍜";
    if (n.includes("thon")) return "🐟";
    if (n.includes("maïs")) return "🌽";
    if (n.includes("haricot") || n.includes("pois chiche") || n.includes("lentille")) return "🫘";
    if (n.includes("sirop d'érable")) return "🍁";
    if (n.includes("miel")) return "🍯";
    if (n.includes("confiture")) return "🍯";
    if (n.includes("arachide") || n.includes("beurre d'ara")) return "🥜";
    if (n.includes("céréale") || n.includes("cheerio") || n.includes("flocon")) return "🥣";
    if (n.includes("huile")) return "🫙";
    if (n.includes("ketchup") || n.includes("sauce tomate")) return "🍅";
    if (n.includes("moutarde") || n.includes("mayonnaise")) return "🫙";

    // === Boulangerie ===
    if (n.includes("bagel")) return "🥯";
    if (n.includes("croissant")) return "🥐";
    if (n.includes("tortilla")) return "🌮";
    if (n.includes("baguette") || n.includes("pain à l'ail")) return "🥖";
    if (n.includes("hot-dog") || n.includes("hamburger")) return "🍔";
    if (n.includes("naan")) return "🫓";
    if (n.includes("muffin anglais")) return "🥐";
    if (n.includes("pain")) return "🍞";

    // === Bonbons & Sucreries ===
    if (n.includes("crème glacée")) return "🍦";
    if (n.includes("gâteau")) return "🎂";
    if (n.includes("brownie")) return "🍫";
    if (n.includes("popcorn")) return "🍿";
    if (n.includes("biscuit") || n.includes("oreo") || n.includes("chips ahoy")) return "🍪";
    if (n.includes("craquelins") || n.includes("ritz")) return "🍘";
    if (n.includes("granola")) return "🌾";
    if (n.includes("chocolat") || n.includes("lindt") || n.includes("kit kat") ||
        n.includes("oh henry") || n.includes("aero") || n.includes("caramilk") ||
        n.includes("coffee crisp") || n.includes("barre")) return "🍫";
    if (n.includes("bonbon") || n.includes("gélifié") || n.includes("réglisse") ||
        n.includes("skittles") || n.includes("m&m") || n.includes("smartie")) return "🍬";
    if (n.includes("chips") || n.includes("lays") || n.includes("doritos") ||
        n.includes("ruffles") || n.includes("pringles") || n.includes("cheetos")) return "🍟";

    // === Boissons ===
    if (n.includes("eau")) return "💧";
    if (n.includes("café") || n.includes("chocolat chaud")) return "☕";
    if (n.includes("thé glacé") || n.includes("nestea")) return "🧋";
    if (n.includes("thé")) return "🍵";
    if (n.includes("jus")) return "🧃";
    if (n.includes("gatorade")) return "🧴";
    if (n.includes("limonade")) return "🍋";
    if (n.includes("pepsi") || n.includes("coca") || n.includes("sprite") ||
        n.includes("7-up") || n.includes("red bull") || n.includes("monster") ||
        n.includes("soda") || n.includes("v8")) return "🥤";

    return "🛒";
  }

  if (category === "clothing") {
    if (n.includes("t-shirt")) return "👕";
    if (n.includes("jeans") || n.includes("pantalon")) return "👖";
    if (n.includes("chaussette")) return "🧦";
    if (n.includes("chaussure") || n.includes("sandales")) return "👟";
    if (n.includes("bottes")) return "👢";
    if (n.includes("casquette")) return "🧢";
    if (n.includes("tuque")) return "🎩";
    if (n.includes("gants")) return "🧤";
    if (n.includes("écharpe")) return "🧣";
    if (n.includes("robe")) return "👗";
    if (n.includes("bermuda")) return "🩳";
    if (n.includes("sous-vêtement") || n.includes("sous-vetement")) return "🩲";
    if (n.includes("manteau") || n.includes("veste") || n.includes("pull")) return "🧥";
    return "👕";
  }

  if (category === "leisure") {
    if (n.includes("cinéma") || n.includes("cinema")) return "🎬";
    if (n.includes("netflix")) return "📺";
    if (n.includes("spotify")) return "🎧";
    if (n.includes("concert") || n.includes("ticket")) return "🎵";
    if (n.includes("karaoké") || n.includes("karaoke")) return "🎤";
    if (n.includes("jeu vidéo") || n.includes("jeu video")) return "🎮";
    if (n.includes("bowling")) return "🎳";
    if (n.includes("piscine")) return "🏊";
    if (n.includes("gym")) return "🏋️";
    if (n.includes("livre")) return "📚";
    if (n.includes("pizza")) return "🍕";
    if (n.includes("mcdonald") || n.includes("repas")) return "🍔";
    if (n.includes("café") || n.includes("starbucks")) return "☕";
    if (n.includes("escape")) return "🔐";
    if (n.includes("manucure")) return "💅";
    if (n.includes("coupe")) return "✂️";
    if (n.includes("uber")) return "🚗";
    if (n.includes("autobus") || n.includes("billet")) return "🚌";
    if (n.includes("vélo") || n.includes("velo")) return "🚲";
    if (n.includes("tatouage")) return "🎨";
    if (n.includes("piercing")) return "💎";
    return "🎮";
  }

  return "🛒";
}

function getWeekDates() {
  const now = new Date();
  const start = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
  return `${fmt(start)} au ${fmt(end)}`;
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

  const studentQuery = useQuery({ queryKey: ["/api/students", studentId] });
  const catalogQuery = useQuery({ queryKey: ["/api/catalog"] });

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
  const allItems = (catalogQuery.data as CatalogItem[]) || [];
  let filteredItems = allItems.filter(item => item.category === selectedCategory);
  if (selectedCategory === "food" && selectedSubcategory) {
    filteredItems = filteredItems.filter(item => item.subcategory === selectedSubcategory);
  }

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev.map(c => {
        if (c.item.id === itemId) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : c;
        }
        return c;
      }).filter(c => c.quantity > 0)
    );
  };

  const calculateCartTotals = () => {
    let subtotal = 0;
    let taxableAmount = 0;
    cart.forEach(cartItem => {
      const itemTotal = cartItem.item.price * cartItem.quantity;
      subtotal += itemTotal;
      if (cartItem.item.isTaxable) taxableAmount += itemTotal;
    });
    const taxes = taxableAmount * QUEBEC_TAX_RATE;
    const total = subtotal + taxes;
    return { subtotal, taxableAmount, taxes, total };
  };

  const cartTotals = calculateCartTotals();
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (!student) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const canAffordCart = remaining >= cartTotals.total;

  // Group items by subcategory for food display
  const groupedItems: { subcat: string | null; icon: string; items: CatalogItem[] }[] = [];
  if (selectedCategory === "food" && !selectedSubcategory) {
    const grouped: Record<string, CatalogItem[]> = {};
    const noSubcat: CatalogItem[] = [];
    pageItems.forEach(item => {
      if (item.subcategory) {
        if (!grouped[item.subcategory]) grouped[item.subcategory] = [];
        grouped[item.subcategory].push(item);
      } else {
        noSubcat.push(item);
      }
    });
    FOOD_SUBCATEGORIES.forEach(sc => {
      if (grouped[sc.id] && grouped[sc.id].length > 0) {
        groupedItems.push({ subcat: sc.id, icon: sc.icon, items: grouped[sc.id] });
      }
    });
    if (noSubcat.length > 0) {
      groupedItems.push({ subcat: null, icon: "🛒", items: noSubcat });
    }
  }

  const useGrouped = selectedCategory === "food" && !selectedSubcategory && groupedItems.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Success Toast */}
      {purchaseSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 border-2 border-green-400">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-black text-lg">Achat complété!</p>
              <p className="text-sm opacity-90">Votre panier a été validé avec succès</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CIRCULAIRE HEADER ── */}
      <div className={`${currentCategory?.color} text-white`}>
        {/* Top bar */}
        <div className="bg-black/30 py-1 px-4 text-center text-xs font-semibold tracking-widest uppercase">
          Valide: {getWeekDates()}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo / Title */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(`/student/${studentId}`)}
                variant="secondary"
                size="sm"
                className="shrink-0"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase">
                    CIRCULAIRE
                  </h1>
                  <span className="text-lg md:text-2xl font-light opacity-80">Mon Budget en Or</span>
                </div>
                <p className="text-white/80 text-sm mt-0.5">
                  Les meilleurs prix cette semaine &mdash; {currentCategory?.name}
                </p>
              </div>
            </div>

            {/* Budget pill + Cart */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white/15 border border-white/30 rounded-lg px-4 py-2 text-center">
                <p className="text-xs uppercase tracking-wide opacity-80">Budget disponible</p>
                <p className={`text-xl font-black ${remaining < 0 ? "text-red-300" : "text-yellow-300"}`}>
                  {remaining.toFixed(2)} $
                </p>
              </div>

              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="relative font-bold text-base px-5"
                    data-testid="button-open-cart"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Mon panier
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center border-2 border-white">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>

                {/* ── CART SHEET ── */}
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-xl">
                      <ShoppingCart className="w-6 h-6" />
                      Mon Panier ({cartItemCount} article{cartItemCount !== 1 ? "s" : ""})
                    </SheetTitle>
                    <SheetDescription>Vérifiez vos achats avant de payer</SheetDescription>
                  </SheetHeader>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-semibold">Votre panier est vide</p>
                        <p className="text-sm">Ajoutez des articles pour commencer</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="flex-1 -mx-6 px-6">
                        <div className="space-y-2 py-4">
                          {cart.map(cartItem => (
                            <div key={cartItem.item.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                              <div className="text-3xl w-10 text-center shrink-0">
                                {getProductEmoji(cartItem.item.name, cartItem.item.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{cartItem.item.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-red-600 dark:text-red-400 font-black text-sm">
                                    {cartItem.item.price.toFixed(2)} $
                                  </span>
                                  {cartItem.item.isTaxable && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">+tx</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(cartItem.item.id, -1)} data-testid={`button-decrease-${cartItem.item.id}`}>
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-7 text-center font-black text-sm">{cartItem.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(cartItem.item.id, 1)} data-testid={`button-increase-${cartItem.item.id}`}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(cartItem.item.id)} data-testid={`button-remove-${cartItem.item.id}`}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Receipt */}
                      <div className="border-t pt-4 space-y-3">
                        <div className="bg-muted/60 rounded-lg p-4 space-y-1.5 font-mono text-sm border">
                          <div className="text-center border-b border-dashed pb-2 mb-2">
                            <Receipt className="w-5 h-5 mx-auto mb-1" />
                            <p className="font-bold">REÇU DE CAISSE</p>
                          </div>
                          <div className="flex justify-between"><span>Sous-total:</span><span>{cartTotals.subtotal.toFixed(2)} $</span></div>
                          {cartTotals.taxableAmount > 0 && (
                            <div className="flex justify-between text-muted-foreground text-xs">
                              <span>TPS + TVQ (14,975%):</span>
                              <span>{cartTotals.taxes.toFixed(2)} $</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-black text-lg">
                            <span>TOTAL:</span>
                            <span className="text-red-600 dark:text-red-400">{cartTotals.total.toFixed(2)} $</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-sm px-1">
                          <span className="text-muted-foreground">Budget restant après l'achat:</span>
                          <span className={`font-bold ${(remaining - cartTotals.total) < 0 ? "text-destructive" : "text-green-600"}`}>
                            {(remaining - cartTotals.total).toFixed(2)} $
                          </span>
                        </div>

                        {!canAffordCart && (
                          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                            <p className="text-sm text-destructive font-semibold">
                              Budget insuffisant! Manque: {(cartTotals.total - remaining).toFixed(2)} $
                            </p>
                          </div>
                        )}
                      </div>

                      <SheetFooter className="mt-3">
                        <Button
                          className="w-full font-black text-lg py-6 bg-red-600 hover:bg-red-700"
                          size="lg"
                          disabled={!canAffordCart || addExpenseMutation.isPending || cart.length === 0}
                          onClick={() => setShowCheckoutConfirm(true)}
                          data-testid="button-checkout"
                        >
                          {addExpenseMutation.isPending ? "Traitement..." : `Payer ${cartTotals.total.toFixed(2)} $`}
                        </Button>
                      </SheetFooter>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="bg-black/20">
          <div className="max-w-7xl mx-auto px-4 flex gap-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-6 py-3 font-black uppercase tracking-wide text-sm transition-all flex items-center gap-2 border-b-4 ${
                  selectedCategory === cat.id
                    ? "border-yellow-400 bg-white/20 text-white"
                    : "border-transparent text-white/70 hover:text-white hover:bg-white/10"
                }`}
                data-testid={`button-category-${cat.id}`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUBCATEGORY FILTERS ── */}
      {selectedCategory === "food" && (
        <div className="bg-white dark:bg-gray-900 border-b shadow-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
            <button
              onClick={() => handleSubcategoryChange(null)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all ${
                selectedSubcategory === null
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-foreground hover:border-red-400"
              }`}
              data-testid="button-subcategory-all"
            >
              🛒 Tout
            </button>
            {FOOD_SUBCATEGORIES.map(subcat => (
              <button
                key={subcat.id}
                onClick={() => handleSubcategoryChange(subcat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${
                  selectedSubcategory === subcat.id
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-foreground hover:border-red-400"
                }`}
                data-testid={`button-subcategory-${subcat.id}`}
              >
                <span>{subcat.icon}</span> {subcat.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-6">

        {/* Cart summary bar */}
        {cartItemCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="w-4 h-4 text-yellow-600" />
              <span>{cartItemCount} article{cartItemCount !== 1 ? "s" : ""} dans le panier</span>
              <span className="text-muted-foreground">&mdash; Total: <strong className="text-red-600 dark:text-red-400">{cartTotals.total.toFixed(2)} $</strong></span>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => setIsCartOpen(true)} data-testid="button-view-cart-bar">
              Voir le panier
            </Button>
          </div>
        )}

        {/* Products — grouped or flat */}
        {useGrouped ? (
          <div className="space-y-8">
            {groupedItems.map(group => (
              <div key={group.subcat ?? "other"}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-red-700 text-white px-4 py-1.5 rounded-r-full -ml-3 md:-ml-4">
                    <span className="text-xl">{group.icon}</span>
                    <span className="font-black text-base uppercase tracking-wide">{group.subcat ?? "Autres"}</span>
                  </div>
                  <div className="flex-1 h-px bg-red-200 dark:bg-red-900" />
                </div>
                <ProductGrid items={group.items} cart={cart} addToCart={addToCart} />
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid items={pageItems} cart={cart} addToCart={addToCart} />
        )}

        {pageItems.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">Aucun article dans cette catégorie</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} data-testid="button-prev-page">
              Précédent
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  data-testid={`button-page-${page}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} data-testid="button-next-page">
              Suivant
            </Button>
          </div>
        )}

        {/* Tax info footer */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm flex items-start gap-3">
          <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-blue-800 dark:text-blue-200">Taxes du Québec (TPS + TVQ)</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Les aliments de base (lait, pain, viandes, fruits, légumes) ne sont <strong>pas taxés</strong>.
              Les bonbons, chips, boissons sucrées et articles non alimentaires sont taxés à <strong>14,975%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Floating cart (mobile) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden z-40">
          <button
            className="bg-red-600 text-white rounded-full w-16 h-16 shadow-xl flex items-center justify-center relative border-4 border-white"
            onClick={() => setIsCartOpen(true)}
            data-testid="button-floating-cart"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center border-2 border-white">
              {cartItemCount}
            </span>
          </button>
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
            <DialogDescription>Vérifiez votre commande avant de payer</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 font-mono text-sm max-h-48 overflow-auto border">
              {cart.map(cartItem => (
                <div key={cartItem.item.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1">{cartItem.quantity}x {cartItem.item.name}</span>
                  <span className="ml-2 font-bold">{(cartItem.item.price * cartItem.quantity).toFixed(2)} $</span>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Sous-total:</span><span>{cartTotals.subtotal.toFixed(2)} $</span></div>
              {cartTotals.taxes > 0 && (
                <div className="flex justify-between text-muted-foreground text-xs"><span>Taxes (TPS + TVQ):</span><span>{cartTotals.taxes.toFixed(2)} $</span></div>
              )}
              <Separator />
              <div className="flex justify-between font-black text-lg">
                <span>Total à payer:</span>
                <span className="text-red-600 dark:text-red-400">{cartTotals.total.toFixed(2)} $</span>
              </div>
            </div>

            <div className="flex justify-between p-3 bg-muted rounded-lg text-sm">
              <span>Budget restant après l'achat:</span>
              <span className={`font-bold ${(remaining - cartTotals.total) < 0 ? "text-destructive" : "text-green-600"}`}>
                {(remaining - cartTotals.total).toFixed(2)} $
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowCheckoutConfirm(false)} data-testid="button-cancel-checkout">
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 font-black"
              onClick={() => addExpenseMutation.mutate(cart)}
              disabled={addExpenseMutation.isPending}
              data-testid="button-confirm-checkout"
            >
              {addExpenseMutation.isPending ? "Traitement..." : "Confirmer et payer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Product Grid Component ──
function ProductGrid({ items, cart, addToCart }: {
  items: CatalogItem[];
  cart: CartItem[];
  addToCart: (item: CatalogItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map(item => {
        const cartItem = cart.find(c => c.item.id === item.id);
        const priceWithTax = item.isTaxable
          ? item.price * (1 + QUEBEC_TAX_RATE)
          : item.price;

        return (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col hover:border-red-400 dark:hover:border-red-600 transition-colors group relative"
            data-testid={`card-product-${item.id}`}
          >
            {/* Quantity badge */}
            {cartItem && (
              <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center shadow">
                {cartItem.quantity}
              </div>
            )}

            {/* Essential / Taxable badge top-right */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
              {item.isEssential ? (
                <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-green-300 dark:border-green-700">
                  <Leaf className="w-2.5 h-2.5" />
                  Essentiel
                </span>
              ) : (
                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-300 dark:border-amber-700">
                  <Star className="w-2.5 h-2.5" />
                  Plaisir
                </span>
              )}
            </div>

            {/* Product emoji */}
            <div className="pt-8 pb-2 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
              <span className="text-5xl group-hover:scale-110 transition-transform duration-200 block">
                {getProductEmoji(item.name, item.category)}
              </span>
            </div>

            {/* Product info */}
            <div className="flex flex-col flex-1 p-2">
              <p className="font-bold text-xs leading-tight line-clamp-2 min-h-[2.5rem] text-foreground">
                {item.name}
              </p>

              {/* Price tag */}
              <div className="mt-2 flex items-end justify-between gap-1">
                <div>
                  <div className="text-red-600 dark:text-red-400 font-black text-xl leading-none">
                    {item.price.toFixed(2)}<span className="text-sm font-bold"> $</span>
                  </div>
                  {item.isTaxable && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {priceWithTax.toFixed(2)} $ avec taxes
                    </p>
                  )}
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={() => addToCart(item)}
                className="mt-2 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-black py-2 rounded-md flex items-center justify-center gap-1 transition-colors"
                data-testid={`button-add-${item.id}`}
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
