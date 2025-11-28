import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { ShoppingCart, AlertCircle, CheckCircle2, ArrowLeft, TrendingUp } from "lucide-react";
import type { CatalogItem, Student } from "@shared/schema";

const CATEGORIES = [
  { id: "food", name: "Nourriture", icon: "🍎", color: "from-green-400 to-green-600" },
  { id: "clothing", name: "Vêtements", icon: "👕", color: "from-blue-400 to-blue-600" },
  { id: "leisure", name: "Loisirs", icon: "🎮", color: "from-purple-400 to-purple-600" },
];

export default function Catalog() {
  const { studentId } = useParams();
  const [location, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
    mutationFn: async (item: CatalogItem) => {
      const res = await apiRequest("POST", "/api/expenses", {
        studentId,
        itemId: item.id,
        amount: item.price,
        category: item.category,
        isEssential: item.isEssential,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", studentId] });
      setShowConfirm(false);
      setSelectedItem(null);
    },
  });

  const student = studentQuery.data as Student | undefined;
  const allItems = catalogQuery.data as CatalogItem[] || [];
  const items = allItems.filter(item => item.category === selectedCategory);
  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);

  if (!student) {
    return <div className="p-8">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const canAfford = selectedItem ? remaining >= selectedItem.price : true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${currentCategory?.color} text-white p-8 mb-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-black mb-2">Circulaire Mon Budget en Or</h1>
              <p className="text-white/90 text-lg">Découvrez nos meilleures offres</p>
            </div>
            <Button
              onClick={() => navigate(`/student/${studentId}`)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-white/20 px-4 py-2 rounded-full">
              Budget restant: <strong className={`ml-1 ${remaining < 0 ? "text-red-300" : "text-green-100"}`}>${remaining}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Category Navigation */}
        <div className="flex gap-3 mb-12 justify-center flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className="px-8 py-6 text-lg flex items-center gap-3 font-semibold"
              size="lg"
            >
              <span className="text-2xl">{cat.icon}</span>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Products Grid - Flyer Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => {
            const isEssential = item.isEssential;
            const isExpensive = item.price > 20;
            
            return (
              <div
                key={item.id}
                className="hover-elevate transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedItem(item);
                  setShowConfirm(true);
                }}
              >
                <Card className="overflow-hidden border-2 border-muted hover:border-primary">
                  {/* Top Banner with Badge */}
                  <div className={`bg-gradient-to-r ${currentCategory?.color} p-3 text-white relative overflow-hidden`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold opacity-90">SPÉCIAL</p>
                        <p className="text-2xl font-black">${item.price}</p>
                      </div>
                      <Badge 
                        className={`${isEssential ? "bg-white text-green-600 hover:bg-white" : "bg-yellow-300 text-yellow-900 hover:bg-yellow-300"}`}
                      >
                        {isEssential ? "Essentiel" : "Plaisir"}
                      </Badge>
                    </div>
                  </div>

                  {/* Product Image/Icon Area */}
                  <div className="h-40 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center border-b-2 border-muted">
                    <div className="text-6xl group-hover:scale-110 transition-transform">
                      {item.category === "food" ? "🍕" : item.category === "clothing" ? "👔" : "🎮"}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <h3 className="font-black text-lg mb-1 line-clamp-2 text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{item.description}</p>

                    {/* Price Highlight */}
                    <div className="mb-4 p-3 bg-muted rounded-lg border-2 border-dashed border-primary/30">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-primary">${item.price}</span>
                        <span className="text-xs text-muted-foreground">seulement</span>
                      </div>
                    </div>

                    {/* Info Badge */}
                    {isExpensive && (
                      <div className="mb-3 flex items-center gap-2 text-xs p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <TrendingUp className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                        <span className="text-orange-700 dark:text-orange-300 font-semibold">Prix élevé</span>
                      </div>
                    )}

                    {/* Buy Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                        setShowConfirm(true);
                      }}
                      className="w-full font-bold py-2 bg-primary hover:bg-primary/90 text-base"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed">
            <p className="text-lg text-muted-foreground">Aucun article dans cette catégorie</p>
          </Card>
        )}
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmation d'achat</DialogTitle>
            <DialogDescription>
              Vérifiez les détails avant d'acheter
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Product Summary */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary/20">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">
                    {selectedItem.category === "food" ? "🍕" : selectedItem.category === "clothing" ? "👔" : "🎮"}
                  </div>
                  <h3 className="font-black text-xl">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedItem.description}</p>
                </div>

                <div className="space-y-3 border-t-2 border-primary/20 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Prix:</span>
                    <span className="font-black text-lg text-primary">${selectedItem.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Budget restant:</span>
                    <span className={`font-bold ${remaining < 0 ? "text-destructive" : "text-green-600"}`}>
                      ${remaining}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Après achat:</span>
                    <span className={`font-black text-lg ${remaining - selectedItem.price < 0 ? "text-destructive" : "text-green-600"}`}>
                      ${remaining - selectedItem.price}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Message */}
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                selectedItem.isEssential 
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                  : selectedItem.price > 20
                  ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                  : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              }`}>
                <div className="mt-1">
                  {selectedItem.isEssential ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </>
                  ) : selectedItem.price > 20 ? (
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <p className={`font-bold text-sm ${
                    selectedItem.isEssential
                      ? "text-green-700 dark:text-green-300"
                      : selectedItem.price > 20
                      ? "text-orange-700 dark:text-orange-300"
                      : "text-blue-700 dark:text-blue-300"
                  }`}>
                    {selectedItem.isEssential 
                      ? "💸 Bravo! Tu économises!" 
                      : selectedItem.price > 20
                      ? "⚠ Achat coûteux"
                      : "💸 Bon choix!"}
                  </p>
                </div>
              </div>

              {!canAfford && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive font-semibold">Pas assez de budget!</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedItem && addExpenseMutation.mutate(selectedItem)}
              disabled={!canAfford || addExpenseMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {addExpenseMutation.isPending ? "Traitement..." : "Acheter maintenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
