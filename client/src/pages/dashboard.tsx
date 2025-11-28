import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, CheckCircle2, DollarSign, ShoppingBag, ShoppingCart } from "lucide-react";
import type { Student, Expense } from "@shared/schema";

export default function Dashboard() {
  const { studentId } = useParams();
  const [_location, navigate] = useLocation();

  const studentQuery = useQuery({
    queryKey: ["/api/students", studentId],
  });

  const expensesQuery = useQuery({
    queryKey: ["/api/expenses", studentId],
  });

  const fixedExpensesQuery = useQuery({
    queryKey: ["/api/fixed-expenses", studentId],
  });

  const payRentMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await apiRequest("PATCH", `/api/fixed-expenses/${expenseId}/pay`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-expenses", studentId] });
    },
  });

  const student = studentQuery.data as Student | undefined;
  const expenses = expensesQuery.data as Expense[] || [];
  const fixedExpenses = fixedExpensesQuery.data || [];

  if (!student) {
    return <div className="p-8">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const spentPercentage = (student.spent / student.budget) * 100;

  // Expense breakdown by category
  const categoryBreakdown = ["food", "clothing", "leisure", "rent"].map(category => ({
    name: category === "food" ? "Nourriture" : category === "clothing" ? "Vêtements" : category === "leisure" ? "Loisirs" : "Loyer",
    value: expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  const successCount = expenses.filter(e => e.feedback === "success").length;
  const warningCount = expenses.filter(e => e.feedback === "warning").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Mon Budget en Or</h1>
            <p className="text-lg text-muted-foreground">Bienvenue, {student.name}</p>
          </div>
          <Button
            onClick={() => navigate(`/student/${studentId}/catalog`)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="w-5 h-5" />
            Faire du Shopping
          </Button>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Budget Initial</p>
                <p className="text-3xl font-bold text-primary">${student.budget}</p>
              </div>
              <DollarSign className="w-12 h-12 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border-destructive">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Dépensé</p>
                <p className="text-3xl font-bold text-destructive">${student.spent}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-destructive opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Restant</p>
              <p className={`text-3xl font-bold ${remaining >= 0 ? "text-green-600" : "text-destructive"}`}>
                ${remaining}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Bonnes Décisions</p>
              <p className="text-3xl font-bold text-chart-2">{successCount}</p>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <p className="text-sm font-semibold mb-3">Utilisation du Budget</p>
          <Progress value={Math.min(spentPercentage, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">{Math.round(spentPercentage)}% utilisé</p>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Expense Breakdown */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Répartition des Dépenses</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Pie Chart */}
            {categoryBreakdown.some(c => c.value > 0) && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.filter(c => c.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fixed Expenses */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dépenses Fixes</h3>
              <div className="space-y-3">
                {fixedExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">${expense.amount}</p>
                    </div>
                    {!expense.isPaid && (
                      <Button
                        size="sm"
                        onClick={() => payRentMutation.mutate(expense.id)}
                        disabled={payRentMutation.isPending}
                      >
                        Payer
                      </Button>
                    )}
                    {expense.isPaid && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                        Payé
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Statistics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm">{successCount} bonnes décisions</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-sm">{warningCount} dépassements</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Decision History */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Historique des Décisions</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune dépense encore</p>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{expense.message}</p>
                    <p className="text-sm text-muted-foreground">${expense.amount} - {expense.category}</p>
                  </div>
                  <Badge variant={expense.feedback === "success" ? "default" : "destructive"}>
                    {expense.feedback === "success" ? "✓" : "!"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
