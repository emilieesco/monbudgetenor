import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

interface ExpenseAmount {
  [key: string]: number;
}

export default function Admin() {
  const [_location, navigate] = useLocation();
  const [expenseAmounts, setExpenseAmounts] = useState<ExpenseAmount>({});

  const defaultExpensesQuery = useQuery({
    queryKey: ["/api/admin/default-expenses"],
  });

  const updateExpensesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/admin/default-expenses", expenseAmounts);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/default-expenses"] });
      alert("Montants des dépenses mis à jour avec succès!");
    },
  });

  // Initialize form with fetched data
  const defaultExpenses = defaultExpensesQuery.data as ExpenseAmount || {};
  
  if (defaultExpensesQuery.isLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  // Initialize expenseAmounts from defaultExpenses if empty
  if (Object.keys(expenseAmounts).length === 0 && Object.keys(defaultExpenses).length > 0) {
    setExpenseAmounts(defaultExpenses);
  }

  const expensesToEdit = Object.keys(expenseAmounts).length > 0 ? expenseAmounts : defaultExpenses;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-primary">Interface Enseignant</h1>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Button>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <p className="text-sm font-semibold text-foreground">
            Modifiez les montants des dépenses fixes pour tous les élèves
          </p>
        </Card>

        {/* Expenses Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Dépenses Fixes</h2>
          
          <div className="space-y-4">
            {Object.entries(expensesToEdit).map(([category, amount]) => (
              <div key={category} className="flex items-end gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-semibold">{category}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => {
                      setExpenseAmounts(prev => ({
                        ...prev,
                        [category]: parseFloat(e.target.value) || 0
                      }));
                    }}
                    className="mt-2"
                    data-testid={`input-expense-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                </div>
                <span className="text-lg font-bold text-primary">${amount}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Mensuel</span>
              <span className="text-2xl font-bold text-primary">
                ${Object.values(expensesToEdit).reduce((sum, val) => sum + val, 0)}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={() => updateExpensesMutation.mutate()}
            disabled={updateExpensesMutation.isPending}
            className="w-full mt-8 bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
            size="lg"
            data-testid="button-save-expenses"
          >
            <Save className="w-5 h-5" />
            {updateExpensesMutation.isPending ? "Enregistrement..." : "Enregistrer les Montants"}
          </Button>
        </Card>

        {/* Instructions */}
        <Card className="p-6 mt-8 bg-muted/50">
          <h3 className="font-semibold mb-2">Comment ça fonctionne</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Modifiez les montants des dépenses fixes</li>
            <li>• Cliquez sur "Enregistrer" pour appliquer les changements</li>
            <li>• Les nouveaux élèves créés utiliseront ces montants</li>
            <li>• Les élèves existants garderont leurs montants actuels</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
