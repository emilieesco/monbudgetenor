import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CatalogItem, Student } from "@shared/schema";

const CATEGORIES = [
  { id: "food", name: "Nourriture", icon: "🍎" },
  { id: "clothing", name: "Vêtements", icon: "👕" },
  { id: "leisure", name: "Loisirs", icon: "🎮" },
];

export default function Catalog() {
  const { studentId } = useParams();
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const studentQuery = useQuery({
    queryKey: ["/api/students", studentId],
  });

  const catalogQuery = useQuery({
    queryKey: ["/api/catalog", selectedCategory],
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
  const items = catalogQuery.data as CatalogItem[] || [];

  if (!student) {
    return <div className="p-8">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const canAfford = selectedItem ? remaining >= selectedItem.price : true;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Catalogue</h1>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm">Budget restant: <strong className={remaining < 0 ? "text-destructive" : "text-green-600"}>${remaining}</strong></span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center gap-2"
            >
              <span>{cat.icon}</span>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <Card
              key={item.id}
              className="overflow-hidden hover-elevate transition-all cursor-pointer"
              onClick={() => {
                setSelectedItem(item);
                setShowConfirm(true);
              }}
            >
              {/* Item Icon/Placeholder */}
              <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-4xl opacity-50">
                  {item.category === "food" ? "🍕" : item.category === "clothing" ? "👔" : "🎮"}
                </div>
              </div>

              {/* Item Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <Badge variant={item.isEssential ? "outline" : "secondary"}>
                    {item.isEssential ? "Essentiel" : "Plaisir"}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">${item.price}</p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                      setShowConfirm(true);
                    }}
                  >
                    Acheter
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucun article disponible dans cette catégorie</p>
          </Card>
        )}
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'achat</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir acheter cet article?
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedItem.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{selectedItem.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prix:</span>
                    <span className="font-semibold">${selectedItem.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget restant:</span>
                    <span className={`font-semibold ${remaining < 0 ? "text-destructive" : "text-green-600"}`}>
                      ${remaining}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span>Il te restera:</span>
                    <span className={`font-semibold text-lg ${remaining - selectedItem.price < 0 ? "text-destructive" : "text-green-600"}`}>
                      ${remaining - selectedItem.price}
                    </span>
                  </div>
                </div>

                {/* Feedback Indicator */}
                <div className="mt-4 flex items-start gap-2 p-2 rounded-lg bg-background">
                  {selectedItem.isEssential ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">💸 Bravo ! Tu économises !</p>
                        <p className="text-xs text-muted-foreground">C'est une bonne décision</p>
                      </div>
                    </>
                  ) : selectedItem.price > 20 ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">⚠ Dépassement</p>
                        <p className="text-xs text-muted-foreground">C'est un achat coûteux</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">💸 Bravo ! Tu économises !</p>
                        <p className="text-xs text-muted-foreground">Bon choix d'achat</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!canAfford && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">Tu n'as pas assez de budget pour cet achat!</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedItem && addExpenseMutation.mutate(selectedItem)}
              disabled={!canAfford || addExpenseMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {addExpenseMutation.isPending ? "Traitement..." : "Acheter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
