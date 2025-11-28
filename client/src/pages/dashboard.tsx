import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, CheckCircle2, DollarSign, ShoppingBag, ShoppingCart, Home, Target, Award, Zap, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { Student, Expense, BonusExpense, Challenge } from "@shared/schema";

export default function Dashboard() {
  const { studentId } = useParams();
  const [_location, navigate] = useLocation();
  const [savingsAmount, setSavingsAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const studentQuery = useQuery({
    queryKey: ["/api/students", studentId],
  });

  const expensesQuery = useQuery({
    queryKey: ["/api/expenses", studentId],
  });

  const fixedExpensesQuery = useQuery({
    queryKey: ["/api/fixed-expenses", studentId],
  });

  const bonusExpensesQuery = useQuery({
    queryKey: ["/api/bonus-expenses", studentId],
  });

  const challengesQuery = useQuery({
    queryKey: ["/api/challenges", studentId],
  });

  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await apiRequest("PATCH", `/api/challenges/${challengeId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", studentId] });
    },
  });

  const savingsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("PATCH", `/api/students/${studentId}/savings`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      setSavingsAmount("");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("PATCH", `/api/students/${studentId}/withdraw`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      setWithdrawAmount("");
    },
  });

  const payRentMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await apiRequest("PATCH", `/api/fixed-expenses/${expenseId}/pay`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-expenses", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
    },
  });

  const student = studentQuery.data as Student | undefined;
  const expenses = expensesQuery.data as Expense[] || [];
  const fixedExpenses = fixedExpensesQuery.data || [];
  const bonusExpenses = bonusExpensesQuery.data || [];
  const challenges = challengesQuery.data as Challenge[] || [];

  if (!student) {
    return <div className="p-8">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const spentPercentage = (student.spent / student.budget) * 100;
  const totalFixedDue = fixedExpenses.filter(fe => !fe.isPaid).reduce((sum, fe) => sum + fe.amount, 0);

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Mon Budget en Or</h1>
            <p className="text-lg text-muted-foreground">Bienvenue, {student.name}</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Retour
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

          <Card className="p-6 bg-purple-50 dark:bg-purple-950">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Épargne</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">${student.savings}</p>
              </div>
              <PiggyBank className="w-12 h-12 text-purple-600 opacity-20 dark:text-purple-300" />
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <p className="text-sm font-semibold mb-3">Utilisation du Budget</p>
          <Progress value={Math.min(spentPercentage, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">{Math.round(spentPercentage)}% utilisé</p>
        </Card>

        {/* Savings Manager */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Gérer tes Épargnes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Save Money */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <Label htmlFor="save-amount" className="font-semibold">Mettre de l'argent de côté</Label>
              <div className="flex gap-2">
                <Input
                  id="save-amount"
                  type="number"
                  placeholder="Montant"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  min="0"
                  data-testid="input-savings-amount"
                />
                <Button
                  onClick={() => {
                    const amount = parseFloat(savingsAmount);
                    if (amount > 0 && amount <= remaining) {
                      savingsMutation.mutate(amount);
                    }
                  }}
                  disabled={savingsMutation.isPending || !savingsAmount}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Épargner
                </Button>
              </div>
              {savingsAmount && parseFloat(savingsAmount) > remaining && (
                <p className="text-xs text-destructive">Tu n'as pas assez d'argent disponible</p>
              )}
            </div>

            {/* Withdraw */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <Label htmlFor="withdraw-amount" className="font-semibold">Retirer de tes épargnes</Label>
              <div className="flex gap-2">
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Montant"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="0"
                  data-testid="input-withdraw-amount"
                />
                <Button
                  onClick={() => {
                    const amount = parseFloat(withdrawAmount);
                    if (amount > 0 && amount <= student.savings) {
                      withdrawMutation.mutate(amount);
                    }
                  }}
                  disabled={withdrawMutation.isPending || !withdrawAmount}
                  variant="outline"
                >
                  Retirer
                </Button>
              </div>
              {withdrawAmount && parseFloat(withdrawAmount) > student.savings && (
                <p className="text-xs text-destructive">Tu n'as pas assez d'épargnes</p>
              )}
            </div>
          </div>
        </Card>

        {/* Bonus Expenses Alert */}
        {bonusExpenses.length > 0 && (
          <Card className="p-6 mb-8 border-destructive/50 bg-destructive/5">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-2">Dépenses Surprises!</h3>
                <div className="space-y-2">
                  {bonusExpenses.map((bonus) => (
                    <div key={bonus.id} className="text-sm">
                      <p className="font-medium">{bonus.title}</p>
                      <p className="text-muted-foreground text-xs">{bonus.description}</p>
                      <p className="font-bold text-destructive">-${bonus.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Fixed Expenses */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold mb-4">Dépenses Fixes à Payer</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fixedExpenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune dépense</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fixedExpenses.map(expense => (
                    <div
                      key={expense.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        expense.isPaid
                          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                          : "bg-muted border-border hover-elevate"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{expense.category}</p>
                        <p className={`text-sm font-bold ${expense.isPaid ? "text-green-700 dark:text-green-300" : "text-foreground"}`}>
                          ${expense.amount}
                        </p>
                      </div>
                      {!expense.isPaid ? (
                        <Button
                          size="sm"
                          onClick={() => payRentMutation.mutate(expense.id)}
                          disabled={payRentMutation.isPending}
                        >
                          Payer
                        </Button>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                          ✓ Payé
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {totalFixedDue > 0 && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-sm font-semibold text-destructive">
                  Total à payer: ${totalFixedDue}
                </p>
              </div>
            )}
          </Card>

          {/* Shopping Access */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Catalogues</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate(`/student/${studentId}/catalog?category=food`)}
                  className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Nourriture
                </Button>
                <Button
                  onClick={() => navigate(`/student/${studentId}/catalog?category=clothing`)}
                  className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Vêtements
                </Button>
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

        {/* Charts */}
        {categoryBreakdown.some(c => c.value > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
          </div>
        )}

        {/* Challenges */}
        {challenges.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Défis Budgétaires</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map(challenge => (
                <div
                  key={challenge.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    challenge.completed
                      ? "bg-green-50 dark:bg-green-950 border-green-500"
                      : "bg-muted border-border hover-elevate"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {challenge.type === "spending" && <Zap className="w-4 h-4 text-amber-500" />}
                        {challenge.type === "essential" && <ShoppingBag className="w-4 h-4 text-blue-500" />}
                        {challenge.type === "fixed" && <DollarSign className="w-4 h-4 text-green-500" />}
                        {challenge.type === "savings" && <Award className="w-4 h-4 text-purple-500" />}
                        <p className="font-bold text-sm">{challenge.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Objectif: {challenge.targetValue}</p>
                    </div>
                    {challenge.completed ? (
                      <Badge className="bg-green-500 text-white ml-2">✓ Complété!</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => completeChallengeMutation.mutate(challenge.id)}
                        disabled={completeChallengeMutation.isPending}
                        className="ml-2"
                      >
                        Valider
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Decision History */}
        <Card className="p-6">
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
