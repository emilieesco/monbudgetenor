import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, CheckCircle2, DollarSign, ShoppingBag, ShoppingCart, Home, Target, Award, Zap, PiggyBank, Download, Search, Save, RotateCcw, Trash2, History, Calendar, ArrowRight, Plus, Trophy, Medal, Star, RefreshCw, ThumbsUp, AlertTriangle, Lightbulb, TrendingUp, TrendingDown, Wallet, BarChart2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import type { Student, Expense, FixedExpense, BonusExpense, Challenge, BudgetSnapshot, Badge as BadgeType, ClassChallenge, SavingsGoal, BADGE_DEFINITIONS } from "@shared/schema";

export default function Dashboard() {
  const { studentId } = useParams();
  const [_location, navigate] = useLocation();
  const { toast } = useToast();
  const [savingsAmount, setSavingsAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [searchExpense, setSearchExpense] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "food" | "clothing" | "leisure" | "rent">("all");
  const [prevBudgetSpent, setPrevBudgetSpent] = useState<number | null>(null);
  const [notifiedChallenges, setNotifiedChallenges] = useState<Set<string>>(new Set());
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [manualExpenseName, setManualExpenseName] = useState("");
  const [manualExpenseAmount, setManualExpenseAmount] = useState("");
  const [manualExpenseCategory, setManualExpenseCategory] = useState<"food" | "clothing" | "leisure">("food");
  const [showMonthSummary, setShowMonthSummary] = useState(false);
  const [customExpenseName, setCustomExpenseName] = useState("");
  const [customExpenseAmount, setCustomExpenseAmount] = useState("");

  const studentQuery = useQuery({
    queryKey: ["/api/students", studentId],
    staleTime: 0,
    refetchInterval: 30000,
  });

  const expensesQuery = useQuery({
    queryKey: ["/api/expenses", studentId],
    staleTime: 0,
  });

  const fixedExpensesQuery = useQuery({
    queryKey: ["/api/fixed-expenses", studentId],
  });

  const bonusExpensesQuery = useQuery({
    queryKey: ["/api/bonus-expenses", studentId],
    staleTime: 0, // Always re-fetch to catch new teacher bonuses
  });

  const appliedEventsQuery = useQuery({
    queryKey: ["/api/students", studentId, "applied-events"],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}/applied-events`);
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 30000,
  });

  const messagesQuery = useQuery({
    queryKey: ["/api/messages/student", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/student/${studentId}`);
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest("PATCH", `/api/messages/${messageId}/read`, { studentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/student", studentId] });
    },
  });

  const challengesQuery = useQuery({
    queryKey: ["/api/challenges", studentId],
  });

  const classChallengesQuery = useQuery({
    queryKey: ["/api/classes", (studentQuery.data as any)?.classId, "challenges"],
    queryFn: async () => {
      const classId = (studentQuery.data as any)?.classId;
      if (!classId) return [];
      const res = await fetch(`/api/classes/${classId}/challenges`);
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    enabled: !!(studentQuery.data as any)?.classId,
    staleTime: 0,
  });

  const snapshotsQuery = useQuery({
    queryKey: ["/api/students", studentId, "snapshots"],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}/snapshots`);
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  const badgesQuery = useQuery({
    queryKey: ["/api/students", studentId, "badges"],
  });

  const savingsGoalsQuery = useQuery({
    queryKey: ["/api/students", studentId, "savings-goals"],
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

  const completeClassChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await apiRequest("PATCH", `/api/class-challenges/${challengeId}/complete`, { studentId });
      return res.json();
    },
    onSuccess: () => {
      const classId = (studentQuery.data as any)?.classId;
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "challenges"] });
      classChallengesQuery.refetch();
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

  const createSnapshotMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await apiRequest("POST", `/api/students/${studentId}/snapshots`, { label });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "snapshots"] });
      setSnapshotLabel("");
      toast({
        title: "Sauvegarde créée",
        description: "Ton point de sauvegarde a été enregistré",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: string) => {
      const res = await apiRequest("POST", `/api/snapshots/${snapshotId}/restore`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-expenses", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-expenses", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", studentId] });
      toast({
        title: "Restauration réussie",
        description: "Ton budget a été restauré au point de sauvegarde sélectionné",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer cette sauvegarde",
        variant: "destructive",
      });
    },
  });

  const deleteSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: string) => {
      const res = await apiRequest("DELETE", `/api/snapshots/${snapshotId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "snapshots"] });
      toast({
        title: "Sauvegarde supprimée",
        description: "Le point de sauvegarde a été supprimé",
      });
    },
  });

  const clearBudgetHistoryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/students/${studentId}/budget-history`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      toast({
        title: "Historique effacé",
        description: "L'historique de tes essais de budget a été supprimé",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer l'historique",
        variant: "destructive",
      });
    },
  });

  const fullResetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/students/${studentId}/full-reset`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-expenses", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/badges", studentId] });
      toast({
        title: "Remis à zéro!",
        description: `Mois 1 — Budget de ${data.budget}$ — Bonne chance ${data.name}!`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser le profil",
        variant: "destructive",
      });
    },
  });

  const newMonthMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/students/${studentId}/new-month`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-expenses", studentId] });
      toast({
        title: "Nouveau mois commencé!",
        description: `Mois ${data.currentMonth || 2} - Tu as reçu ton budget de $${data.monthlyBudget || data.budget}`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer un nouveau mois",
        variant: "destructive",
      });
    },
  });

  const addManualExpenseMutation = useMutation({
    mutationFn: async (data: { name: string; amount: number; category: string }) => {
      const res = await apiRequest("POST", `/api/students/${studentId}/manual-expense`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", studentId] });
      setManualExpenseName("");
      setManualExpenseAmount("");
      toast({
        title: "Dépense ajoutée",
        description: "Ta dépense a été enregistrée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense",
        variant: "destructive",
      });
    },
  });

  const addCustomFixedExpenseMutation = useMutation({
    mutationFn: async (data: { name: string; amount: number }) => {
      const res = await apiRequest("POST", `/api/fixed-expenses/${studentId}/custom`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-expenses", studentId] });
      setCustomExpenseName("");
      setCustomExpenseAmount("");
      toast({ title: "Dépense ajoutée", description: "Ta dépense personnelle a été créée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter la dépense", variant: "destructive" });
    },
  });

  const deleteCustomFixedExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await apiRequest("DELETE", `/api/fixed-expenses/${expenseId}/custom`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fixed-expenses", studentId] });
      toast({ title: "Dépense supprimée" });
    },
  });

  const applyBonusMutation = useMutation({
    mutationFn: async (bonusId: string) => {
      const res = await apiRequest("PATCH", `/api/bonus-expenses/${bonusId}/pay`);
      return res.json();
    },
    onSuccess: (bonus) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-expenses", studentId] });
      toast({
        title: "Bonus reçu !",
        description: `Ton enseignant t'a accordé un bonus de $${bonus.amount?.toFixed(2) || ""}. Il a été ajouté à ton budget !`,
      });
    },
  });

  const checkBadgesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/students/${studentId}/check-badges`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.awardedBadges && data.awardedBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "badges"] });
        data.awardedBadges.forEach((badge: any) => {
          toast({
            title: "Nouveau Badge Obtenu!",
            description: `${badge.icon} ${badge.name}`,
          });
        });
      }
    },
  });

  const createSavingsGoalMutation = useMutation({
    mutationFn: async (data: { title: string; targetAmount: number }) => {
      const res = await apiRequest("POST", "/api/savings-goals", {
        studentId,
        ...data,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "savings-goals"] });
      toast({
        title: "Objectif créé",
        description: "Ton objectif d'épargne a été ajouté",
      });
    },
  });

  const deleteSavingsGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await apiRequest("DELETE", `/api/savings-goals/${goalId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "savings-goals"] });
    },
  });

  const student = studentQuery.data as Student | undefined;
  const expenses = expensesQuery.data as Expense[] || [];
  const fixedExpenses = (fixedExpensesQuery.data as FixedExpense[] | undefined) || [];
  const bonusExpenses = (bonusExpensesQuery.data || []) as Array<{ id: string; title: string; description: string; amount: number; isPaid: boolean; createdAt: string }>;
  const appliedEvents = (appliedEventsQuery.data || []) as Array<{ id: string; title: string; description: string; amount: number; type: string; appliedAt: string }>;
  const challenges = challengesQuery.data as Challenge[] || [];
  const classChallenges = (classChallengesQuery.data || []) as ClassChallenge[];
  const snapshots = snapshotsQuery.data as BudgetSnapshot[] || [];
  const badges = badgesQuery.data as Array<BadgeType & { name: string; icon: string; tier: string }> || [];
  const savingsGoals = savingsGoalsQuery.data as SavingsGoal[] || [];
  const messages = (messagesQuery.data || []) as Array<{ id: string; content: string; type: "congratulations" | "warning" | "info"; timestamp: string; isRead: boolean }>;
  const unreadCount = messages.filter(m => !m.isRead).length;

  // Offline support - cache data
  useEffect(() => {
    if (student) {
      localStorage.setItem(`student_${studentId}`, JSON.stringify(student));
    }
    if (expenses.length > 0) {
      localStorage.setItem(`expenses_${studentId}`, JSON.stringify(expenses));
    }
    if (challenges.length > 0) {
      localStorage.setItem(`challenges_${studentId}`, JSON.stringify(challenges));
    }
  }, [student, expenses, challenges, studentId]);

  // Budget exceeded notification
  useEffect(() => {
    if (student && prevBudgetSpent !== null && student.spent > prevBudgetSpent && student.spent > student.budget) {
      toast({
        title: "Attention! 🚨",
        description: `Tu as dépassé ton budget de $${(student.spent - student.budget).toFixed(2)}`,
        variant: "destructive",
      });
    }
    if (student) {
      setPrevBudgetSpent(student.spent);
    }
  }, [student?.spent, student?.budget, toast]);

  // Challenge completion notification
  useEffect(() => {
    challenges.forEach(ch => {
      if (ch.completed && !notifiedChallenges.has(ch.id)) {
        toast({
          title: "Défi Complété!",
          description: `Tu as réussi: ${ch.title}`,
        });
        setNotifiedChallenges(prev => new Set(prev).add(ch.id));
      }
    });
  }, [challenges, notifiedChallenges, toast]);

  // Auto-apply unpaid bonus expenses from teacher
  useEffect(() => {
    const unpaidBonuses = bonusExpenses.filter(b => !b.isPaid);
    unpaidBonuses.forEach(bonus => {
      applyBonusMutation.mutate(bonus.id);
    });
  }, [bonusExpenses.length]);

  // Check for new badges periodically
  useEffect(() => {
    if (student && expenses.length > 0) {
      checkBadgesMutation.mutate();
    }
  }, [student?.savings, expenses.length]);

  if (!student) {
    const cachedStudent = localStorage.getItem(`student_${studentId}`);
    if (cachedStudent) {
      return <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Mode hors-ligne - Dernières données disponibles</p>
      </div>;
    }
    return <div className="p-8">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const spentPercentage = (student.spent / student.budget) * 100;
  const totalFixedDue = fixedExpenses.filter(fe => !fe.isPaid).reduce((sum, fe) => sum + fe.amount, 0);

  // Filter expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.message.toLowerCase().includes(searchExpense.toLowerCase());
    const matchesCategory = filterCategory === "all" || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Expense breakdown by category (catalog purchases only)
  const categoryBreakdown = ["food", "clothing", "leisure", "transport", "rent"].map(category => ({
    name: category === "food" ? "Nourriture" : category === "clothing" ? "Vêtements" : category === "leisure" ? "Loisirs" : category === "transport" ? "Transport" : "Loyer",
    value: expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  // Full breakdown including paid fixed expenses
  const fixedPaidTotal = fixedExpenses.filter(fe => fe.isPaid).reduce((sum, fe) => sum + fe.amount, 0);
  const fullCategoryBreakdown = [
    ...categoryBreakdown,
    { name: "Dépenses Fixes", value: parseFloat(fixedPaidTotal.toFixed(2)) },
  ].filter(c => c.value > 0);

  // Essential vs Non-essential (fixed expenses are always essential)
  const essentialBreakdown = [
    {
      name: "Essentiel",
      value: parseFloat((
        expenses.filter(e => e.isEssential).reduce((s, e) => s + e.amount, 0) + fixedPaidTotal
      ).toFixed(2)),
    },
    {
      name: "Non-essentiel",
      value: parseFloat(expenses.filter(e => !e.isEssential).reduce((s, e) => s + e.amount, 0).toFixed(2)),
    },
  ].filter(c => c.value > 0);

  // CSV download — all expenses for the month
  const downloadCSV = () => {
    const monthNum = student.currentMonth || 1;
    const BOM = "\uFEFF"; // UTF-8 BOM for Excel
    const header = ["Date", "Description", "Catégorie", "Montant ($)", "Type", "Essentiel"];
    const fixedRows = fixedExpenses.filter(fe => fe.isPaid).map(fe => [
      new Date().toLocaleDateString("fr-CA"),
      fe.name,
      "Dépense fixe",
      fe.amount.toFixed(2),
      "Fixe",
      "Oui",
    ]);
    const catalogRows = expenses.map(e => [
      new Date(e.timestamp).toLocaleDateString("fr-CA"),
      e.message,
      e.category === "food" ? "Nourriture" : e.category === "clothing" ? "Vêtements" : e.category === "leisure" ? "Loisirs" : e.category === "transport" ? "Transport" : e.category,
      e.amount.toFixed(2),
      "Variable",
      e.isEssential ? "Oui" : "Non",
    ]);
    const summaryRows = [
      [],
      ["=== RÉSUMÉ ==="],
      ["Budget mensuel", `$${student.monthlyBudget?.toFixed(2) ?? student.budget.toFixed(2)}`],
      ["Budget actuel", `$${student.budget.toFixed(2)}`],
      ["Total dépensé", `$${student.spent.toFixed(2)}`],
      ["Épargne", `$${student.savings.toFixed(2)}`],
      ["Restant", `$${(student.budget - student.spent).toFixed(2)}`],
    ];
    const rows = [header, ...fixedRows, ...catalogRows, ...summaryRows];
    const csv = BOM + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bilan_${student.name}_mois${monthNum}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = expenses.filter(e => e.feedback === "success").length;
  const warningCount = expenses.filter(e => e.feedback === "warning").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Mon Budget en Or</h1>
            <div className="flex items-center gap-3">
              <p className="text-lg text-muted-foreground">Bienvenue, {student.name}</p>
              <Badge variant="secondary" className="text-sm">
                <Calendar className="w-3 h-3 mr-1" />
                Mois {student.currentMonth || 1}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setShowMonthSummary(true)}
              disabled={newMonthMutation.isPending}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              data-testid="button-new-month"
            >
              <Calendar className="w-5 h-5" />
              {newMonthMutation.isPending ? "En cours..." : "Nouveau Mois"}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setShowSnapshots(!showSnapshots)}
              variant={showSnapshots ? "default" : "outline"}
              className="flex items-center gap-2"
              data-testid="button-toggle-snapshots"
            >
              <History className="w-5 h-5" />
              Sauvegardes
              {snapshots.length > 0 && (
                <Badge variant="secondary" className="ml-1">{snapshots.length}</Badge>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={fullResetMutation.isPending}
                  data-testid="button-full-reset"
                >
                  <RefreshCw className="w-4 h-4" />
                  {fullResetMutation.isPending ? "Réinitialisation..." : "Recommencer"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Recommencer à zéro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action va effacer tous tes achats, remettre ton budget au mois 1 et supprimer tes badges. Ton argent économisé sera perdu. Es-tu sûr(e)?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => fullResetMutation.mutate()}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Oui, recommencer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Retour
            </Button>
          </div>
        </div>

        {/* Snapshots Panel */}
        {showSnapshots && (
          <Card className="p-6 mb-8 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                Points de Sauvegarde
              </h2>
              <p className="text-sm text-muted-foreground">Maximum 3 sauvegardes</p>
            </div>
            
            {/* Create Snapshot */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nom du point de sauvegarde..."
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                className="flex-1"
                data-testid="input-snapshot-label"
              />
              <Button
                onClick={() => {
                  if (snapshotLabel.trim()) {
                    createSnapshotMutation.mutate(snapshotLabel.trim());
                  }
                }}
                disabled={!snapshotLabel.trim() || createSnapshotMutation.isPending}
                className="flex items-center gap-2"
                data-testid="button-create-snapshot"
              >
                <Save className="w-4 h-4" />
                {createSnapshotMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>

            {/* Snapshot List */}
            {snapshots.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun point de sauvegarde. Crée-en un pour pouvoir revenir à cet état plus tard.
              </p>
            ) : (
              <div className="space-y-2">
                {snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`snapshot-${snapshot.id}`}>
                    <div>
                      <p className="font-medium">{snapshot.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(snapshot.createdAt).toLocaleDateString("fr-CA")} à{" "}
                        {new Date(snapshot.createdAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Budget: ${snapshot.studentState.budget.toFixed(2)} | Dépensé: ${snapshot.studentState.spent.toFixed(2)} | Épargne: ${snapshot.studentState.savings.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreSnapshotMutation.mutate(snapshot.id)}
                        disabled={restoreSnapshotMutation.isPending}
                        className="flex items-center gap-1"
                        data-testid={`button-restore-snapshot-${snapshot.id}`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSnapshotMutation.mutate(snapshot.id)}
                        disabled={deleteSnapshotMutation.isPending}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-snapshot-${snapshot.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Budget Actuel</p>
                <p className="text-3xl font-bold text-primary">${student.budget.toFixed(2)}</p>
                {student.budgetHistory && student.budgetHistory.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">{student.budgetHistory.length} essais</p>
                )}
              </div>
              <DollarSign className="w-12 h-12 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border-destructive">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Dépensé</p>
                <p className="text-3xl font-bold text-destructive">${student.spent.toFixed(2)}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-destructive opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Restant</p>
              <p className={`text-3xl font-bold ${remaining >= 0 ? "text-green-600" : "text-destructive"}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-purple-50 dark:bg-purple-950">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Épargne</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">${student.savings.toFixed(2)}</p>
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

        {/* Gamification Section - Badges */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Mes Badges</h2>
            <Badge variant="secondary" className="ml-auto">{badges.length} badge{badges.length !== 1 ? "s" : ""}</Badge>
          </div>
          
          {badges.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Tu n'as pas encore de badges. Continue à bien gérer ton budget pour en débloquer!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-lg text-center border-2 ${
                    badge.tier === "platinum" ? "bg-purple-100 dark:bg-purple-900/30 border-purple-400" :
                    badge.tier === "gold" ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400" :
                    badge.tier === "silver" ? "bg-gray-100 dark:bg-gray-700 border-gray-400" :
                    "bg-orange-100 dark:bg-orange-900/30 border-orange-400"
                  }`}
                  data-testid={`badge-${badge.type}`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="text-xs font-semibold mt-1">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{badge.tier}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Savings Goals Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold">Mes Objectifs d'Épargne</h2>
          </div>
          
          {/* Create New Goal */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nom de l'objectif (ex: Vélo neuf)"
              className="flex-1"
              id="goal-title"
              data-testid="input-goal-title"
            />
            <Input
              type="number"
              placeholder="Montant $"
              className="w-32"
              id="goal-amount"
              min="1"
              data-testid="input-goal-amount"
            />
            <Button
              onClick={() => {
                const title = (document.getElementById("goal-title") as HTMLInputElement)?.value;
                const amount = parseFloat((document.getElementById("goal-amount") as HTMLInputElement)?.value);
                if (title && amount > 0) {
                  createSavingsGoalMutation.mutate({ title, targetAmount: amount });
                  (document.getElementById("goal-title") as HTMLInputElement).value = "";
                  (document.getElementById("goal-amount") as HTMLInputElement).value = "";
                }
              }}
              disabled={createSavingsGoalMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-create-goal"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>

          {savingsGoals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucun objectif d'épargne. Fixe-toi des objectifs pour mieux épargner!
            </p>
          ) : (
            <div className="space-y-3">
              {savingsGoals.map((goal) => {
                const progress = Math.min((student.savings / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id} className="p-4 bg-muted rounded-lg" data-testid={`goal-${goal.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{goal.title}</p>
                      <div className="flex items-center gap-2">
                        {goal.completed ? (
                          <Badge variant="default" className="bg-green-600">Atteint!</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            ${student.savings.toFixed(0)} / ${goal.targetAmount}
                          </span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteSavingsGoalMutation.mutate(goal.id)}
                          data-testid={`button-delete-goal-${goal.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complété</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Budget History */}
        {student.budgetHistory && student.budgetHistory.length > 1 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Historique de tes Budgets</h2>
                <Badge variant="secondary">{student.budgetHistory.length} essais</Badge>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearBudgetHistoryMutation.mutate()}
                disabled={clearBudgetHistoryMutation.isPending}
                className="flex items-center gap-2"
                data-testid="button-clear-budget-history"
              >
                <Trash2 className="w-4 h-4" />
                {clearBudgetHistoryMutation.isPending ? "Suppression..." : "Effacer l'historique"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Cet historique montre tes différentes tentatives de configuration du budget. Tu peux l'effacer pour repartir proprement.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(Array.isArray(student.budgetHistory) ? student.budgetHistory : []).map((h, i) => {
                const date = typeof h.date === 'string' ? new Date(h.date) : h.date;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Essai {student.budgetHistory!.length - i}</span>
                    <span className="font-bold text-primary">${h.budget.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{date.toLocaleDateString('fr-CA')}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

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

        {/* Manual Expense Form */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Ajouter une Dépense</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Tu peux ajouter une dépense qui n'est pas dans le catalogue
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Description</Label>
              <Input
                id="expense-name"
                placeholder="Ex: Billet de bus"
                value={manualExpenseName}
                onChange={(e) => setManualExpenseName(e.target.value)}
                data-testid="input-manual-expense-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Montant ($)</Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="0.00"
                value={manualExpenseAmount}
                onChange={(e) => setManualExpenseAmount(e.target.value)}
                min="0.01"
                step="0.01"
                data-testid="input-manual-expense-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Catégorie</Label>
              <select
                id="expense-category"
                value={manualExpenseCategory}
                onChange={(e) => setManualExpenseCategory(e.target.value as "food" | "clothing" | "leisure")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                data-testid="select-manual-expense-category"
              >
                <option value="food">Nourriture</option>
                <option value="clothing">Vêtements</option>
                <option value="leisure">Loisirs</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  const amount = parseFloat(manualExpenseAmount);
                  if (manualExpenseName.trim() && amount > 0) {
                    addManualExpenseMutation.mutate({
                      name: manualExpenseName.trim(),
                      amount,
                      category: manualExpenseCategory,
                    });
                  }
                }}
                disabled={addManualExpenseMutation.isPending || !manualExpenseName.trim() || !manualExpenseAmount}
                className="w-full"
                data-testid="button-add-manual-expense"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
          {manualExpenseAmount && parseFloat(manualExpenseAmount) > remaining && (
            <p className="text-xs text-destructive mt-2">Attention: Cette dépense dépasse ton budget restant</p>
          )}
        </Card>

        {/* Teacher Messages */}
        {messages.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Messages de ton enseignant</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" data-testid="badge-unread-messages">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</Badge>
              )}
            </div>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg border text-sm transition-opacity ${
                    msg.isRead ? "opacity-50" : ""
                  } ${
                    msg.type === "congratulations"
                      ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                      : msg.type === "warning"
                      ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                      : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`font-medium ${
                        msg.type === "congratulations" ? "text-green-800 dark:text-green-200"
                        : msg.type === "warning" ? "text-amber-800 dark:text-amber-200"
                        : "text-blue-800 dark:text-blue-200"
                      }`}>
                        {msg.type === "congratulations" ? "Félicitations" : msg.type === "warning" ? "Avertissement" : "Info"}
                      </p>
                      <p className="text-foreground mt-1">{msg.content}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(msg.timestamp).toLocaleDateString("fr-CA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!msg.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(msg.id)}
                        disabled={markAsReadMutation.isPending}
                        data-testid={`button-mark-read-${msg.id}`}
                        className="shrink-0 text-xs"
                      >
                        Marquer comme lu
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Applied Bonuses History */}
        {bonusExpenses.filter(b => b.isPaid).length > 0 && (
          <Card className="p-6 mb-8 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-green-700 dark:text-green-300" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">Bonus reçus de l'enseignant</h3>
            </div>
            <div className="space-y-2">
              {bonusExpenses.filter(b => b.isPaid).map((bonus) => (
                <div key={bonus.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">{bonus.title}</p>
                    <p className="text-green-700 dark:text-green-300 text-xs">{bonus.description}</p>
                  </div>
                  <span className="font-bold text-green-700 dark:text-green-300">+${bonus.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Applied Surprise Events from Teacher */}
        {appliedEvents.length > 0 && (
          <Card className="p-6 mb-8 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-orange-700 dark:text-orange-300" />
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">Événements de l'enseignant</h3>
            </div>
            <div className="space-y-2">
              {appliedEvents.map((event) => (
                <div key={event.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-orange-900 dark:text-orange-100">{event.title}</p>
                    <p className="text-orange-700 dark:text-orange-300 text-xs">{event.description}</p>
                  </div>
                  <span className={`font-bold ${event.type === "bonus_salary" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {event.type === "bonus_salary" ? "+" : "-"}${Number(event.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Fixed Expenses */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold mb-4">Dépenses Fixes à Payer</h2>

            {/* Teacher-defined expenses */}
            {fixedExpenses.filter(e => !e.isCustom).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune dépense de la classe</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {fixedExpenses.filter(e => !e.isCustom).map(expense => (
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
                        ${expense.amount.toFixed(2)}
                      </p>
                    </div>
                    {!expense.isPaid ? (
                      <Button size="sm" onClick={() => payRentMutation.mutate(expense.id)} disabled={payRentMutation.isPending}>
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

            {totalFixedDue > 0 && (
              <div className="mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <p className="text-sm font-semibold text-destructive">
                  Total à payer: ${totalFixedDue.toFixed(2)}
                </p>
              </div>
            )}

            {/* Custom personal expenses */}
            <Separator className="my-4" />
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold">Mes Dépenses Personnelles</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Ajoute tes dépenses personnelles mensuelles (carte de crédit, forfait téléphone, abonnements…)
            </p>

            {/* Quick suggestion pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {["Carte de crédit", "Forfait téléphone", "Internet", "Gym", "Netflix", "Assurance auto", "Remboursement voiture", "Spotify"].map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setCustomExpenseName(suggestion)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    customExpenseName === suggestion
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border hover:bg-accent"
                  }`}
                  data-testid={`suggestion-${suggestion.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Add custom expense form */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[140px] space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Ex: Carte de crédit"
                  value={customExpenseName}
                  onChange={e => setCustomExpenseName(e.target.value)}
                  data-testid="input-custom-expense-name"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-xs">Montant ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={customExpenseAmount}
                  onChange={e => setCustomExpenseAmount(e.target.value)}
                  data-testid="input-custom-expense-amount"
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  onClick={() => {
                    const amount = parseFloat(customExpenseAmount);
                    if (customExpenseName.trim() && amount > 0) {
                      addCustomFixedExpenseMutation.mutate({ name: customExpenseName.trim(), amount });
                    }
                  }}
                  disabled={addCustomFixedExpenseMutation.isPending || !customExpenseName.trim() || !customExpenseAmount}
                  data-testid="button-add-custom-expense"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </div>

            {/* List of custom expenses */}
            {fixedExpenses.filter(e => e.isCustom).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fixedExpenses.filter(e => e.isCustom).map(expense => (
                  <div
                    key={expense.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      expense.isPaid
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{expense.category}</p>
                      <p className={`text-sm font-bold ${expense.isPaid ? "text-green-700 dark:text-green-300" : "text-blue-700 dark:text-blue-300"}`}>
                        ${expense.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {!expense.isPaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => payRentMutation.mutate(expense.id)}
                          disabled={payRentMutation.isPending}
                          data-testid={`button-pay-custom-expense-${expense.id}`}
                        >
                          Payer
                        </Button>
                      )}
                      {expense.isPaid && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs">
                          ✓ Payé
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteCustomFixedExpenseMutation.mutate(expense.id)}
                        disabled={deleteCustomFixedExpenseMutation.isPending}
                        data-testid={`button-delete-custom-expense-${expense.id}`}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
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
        {fullCategoryBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Full breakdown bar chart */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-1">Répartition des Dépenses</h2>
              <p className="text-sm text-muted-foreground mb-4">Achats + dépenses fixes payées</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fullCategoryBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Montant"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {fullCategoryBreakdown.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Essentiel vs Non-essentiel pie */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-1">Essentiel vs Non-essentiel</h2>
              <p className="text-sm text-muted-foreground mb-4">Les dépenses fixes comptent comme essentielles</p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={essentialBreakdown}
                    cx="50%"
                    cy="45%"
                    labelLine={true}
                    label={({ name, value, percent }) =>
                      `${name}: $${Number(value).toFixed(2)} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={90}
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--chart-1))" />
                    <Cell fill="hsl(var(--chart-4))" />
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Montant"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Challenges */}
        {/* Défis de classe (créés par l'enseignant) */}
        {classChallenges.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-semibold">Défis de ton Enseignant</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classChallenges.map(challenge => {
                const alreadyCompleted = challenge.completedBy?.includes(studentId);

                // Compute progress based on challenge type
                let currentValue = 0;
                let progressPct = 0;
                let isAchieved = false;
                let progressLabel = "";
                const target = challenge.targetValue;

                if (challenge.type === "save_amount") {
                  currentValue = student?.savings ?? 0;
                  progressPct = Math.min(100, (currentValue / target) * 100);
                  isAchieved = currentValue >= target;
                  progressLabel = `${currentValue.toFixed(2)}$ / ${target.toFixed(2)}$ épargné`;
                } else if (challenge.type === "limit_spending") {
                  currentValue = student?.spent ?? 0;
                  progressPct = Math.min(100, currentValue <= target ? 100 : (target / currentValue) * 100);
                  isAchieved = currentValue <= target;
                  progressLabel = `${currentValue.toFixed(2)}$ dépensé (max ${target.toFixed(2)}$)`;
                } else if (challenge.type === "essential_ratio") {
                  const totalExp = expenses.length;
                  const essentialCount = expenses.filter(e => e.isEssential).length;
                  currentValue = totalExp > 0 ? Math.round((essentialCount / totalExp) * 100) : 0;
                  progressPct = Math.min(100, (currentValue / target) * 100);
                  isAchieved = currentValue >= target;
                  progressLabel = `${currentValue}% essentiels (objectif: ${target}%)`;
                } else {
                  // custom: always allow manual validation
                  isAchieved = true;
                  progressPct = 100;
                  progressLabel = "Validation manuelle";
                }

                return (
                  <div
                    key={challenge.id}
                    data-testid={`card-class-challenge-${challenge.id}`}
                    className={`p-4 rounded-lg border-2 transition ${
                      alreadyCompleted
                        ? "bg-green-50 dark:bg-green-950 border-green-500"
                        : isAchieved
                        ? "bg-amber-50 dark:bg-amber-950 border-amber-400"
                        : "bg-amber-50/60 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-amber-500 shrink-0" />
                          <p className="font-bold text-sm" data-testid={`text-class-challenge-title-${challenge.id}`}>{challenge.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{challenge.description}</p>
                        {challenge.reward && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Récompense: {challenge.reward}</p>
                        )}
                        {challenge.deadline && (
                          <p className="text-xs text-muted-foreground mt-1">Avant le: {new Date(challenge.deadline).toLocaleDateString("fr-CA")}</p>
                        )}
                      </div>
                      {alreadyCompleted ? (
                        <Badge className="bg-green-500 text-white ml-2 shrink-0">Complété!</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => completeClassChallengeMutation.mutate(challenge.id)}
                          disabled={!isAchieved || completeClassChallengeMutation.isPending}
                          className="ml-2 shrink-0"
                          data-testid={`button-complete-class-challenge-${challenge.id}`}
                        >
                          Valider
                        </Button>
                      )}
                    </div>

                    {/* Progress bar */}
                    {!alreadyCompleted && challenge.type !== "custom" && (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">{progressLabel}</span>
                          <span className={`text-xs font-bold ${isAchieved ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {Math.round(progressPct)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${isAchieved ? "bg-green-500" : "bg-amber-400"}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {isAchieved && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">Objectif atteint! Tu peux valider.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Défis personnels */}
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

        {/* Decision History with Filters */}
        <Card className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 className="text-xl font-semibold">Historique Détaillé</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={downloadCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4" />
                Bilan CSV
              </Button>
              <Button
                onClick={() => {
                  const doc = new jsPDF();
                  doc.setFontSize(16);
                  doc.text("Rapport Budgétaire", 10, 10);
                  doc.setFontSize(10);
                  doc.text(`Étudiant: ${student.name}`, 10, 20);
                  doc.text(`Budget: $${student.budget.toFixed(2)} | Dépensé: $${student.spent.toFixed(2)} | Épargne: $${student.savings.toFixed(2)}`, 10, 30);
                  doc.text(`Restant: $${remaining.toFixed(2)} (${Math.round(spentPercentage)}% utilisé)`, 10, 40);
                  doc.text("", 10, 50);
                  doc.text("Dépenses:", 10, 60);
                  let y = 70;
                  filteredExpenses.forEach(exp => {
                    if (y > 280) {
                      doc.addPage();
                      y = 10;
                    }
                    doc.text(`${exp.message} - $${exp.amount.toFixed(2)}`, 15, y);
                    y += 5;
                  });
                  doc.save(`rapport_${student.name}.pdf`);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-export-pdf"
              >
                <Download className="w-4 h-4" />
                Rapport PDF
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="search-expense" className="text-sm">Rechercher</Label>
              <div className="flex gap-2 items-center">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-expense"
                  placeholder="Cherche une dépense..."
                  value={searchExpense}
                  onChange={(e) => setSearchExpense(e.target.value)}
                  data-testid="input-search-expense"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filter-category" className="text-sm">Catégorie</Label>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                data-testid="select-filter-category"
              >
                <option value="all">Toutes les catégories</option>
                <option value="food">Nourriture</option>
                <option value="clothing">Vêtements</option>
                <option value="leisure">Loisirs</option>
                <option value="rent">Loyer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredExpenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {expenses.length === 0 ? "Aucune dépense encore" : "Aucune dépense ne correspond à ta recherche"}
              </p>
            ) : (
              filteredExpenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{expense.message}</p>
                    <p className="text-sm text-muted-foreground">${expense.amount.toFixed(2)} - {expense.category}</p>
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

      {/* ── END-OF-MONTH SUMMARY DIALOG ── */}
      {(() => {
        if (!student) return null;
        const monthlyBudget = (student as any).monthlyBudget || (student.budget + student.spent);
        const savingsThisMonth = student.budget;
        const savingsPct = monthlyBudget > 0 ? (savingsThisMonth / monthlyBudget) * 100 : 0;
        const essentialAmt = expenses.filter(e => e.isEssential).reduce((s: number, e: Expense) => s + e.amount, 0);
        const totalCatalogAmt = expenses.reduce((s: number, e: Expense) => s + e.amount, 0);
        const essentialRatio = totalCatalogAmt > 0 ? essentialAmt / totalCatalogAmt : 1;
        const fixedPaidCount = (fixedExpenses as any[]).filter((fe: any) => fe.isPaid).length;
        const fixedTotal = (fixedExpenses as any[]).length;

        let score = 0;
        if (savingsPct >= 20) score += 3;
        else if (savingsPct >= 10) score += 2;
        else if (savingsPct >= 5) score += 1;
        if (essentialRatio >= 0.7) score += 2;
        else if (essentialRatio >= 0.5) score += 1;
        if (fixedTotal > 0 && fixedPaidCount === fixedTotal) score += 2;
        else if (fixedPaidCount > 0) score += 1;

        type Grade = "excellent" | "tres_bien" | "correct" | "a_ameliorer";
        let grade: Grade;
        if (score >= 6) grade = "excellent";
        else if (score >= 4) grade = "tres_bien";
        else if (score >= 2) grade = "correct";
        else grade = "a_ameliorer";

        const gradeInfo: Record<Grade, { Icon: typeof CheckCircle2; label: string; bg: string; border: string; iconColor: string; titleColor: string; tip: string }> = {
          excellent: {
            Icon: Trophy, label: "Excellent!", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-300 dark:border-yellow-700",
            iconColor: "text-yellow-500", titleColor: "text-yellow-700 dark:text-yellow-400",
            tip: "Tu es un(e) champion(ne) de la gestion budgétaire! Continue comme ça le mois prochain!",
          },
          tres_bien: {
            Icon: ThumbsUp, label: "Très bien!", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-300 dark:border-blue-700",
            iconColor: "text-blue-500", titleColor: "text-blue-700 dark:text-blue-400",
            tip: "Super mois! Pour encore mieux faire, essaie d'augmenter ton épargne de 5% le mois prochain.",
          },
          correct: {
            Icon: CheckCircle2, label: "Correct!", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-300 dark:border-green-700",
            iconColor: "text-green-500", titleColor: "text-green-700 dark:text-green-400",
            tip: "Pas mal! Concentre-toi sur réduire tes dépenses de loisirs pour épargner davantage le mois prochain.",
          },
          a_ameliorer: {
            Icon: AlertTriangle, label: "À améliorer", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-300 dark:border-orange-700",
            iconColor: "text-orange-500", titleColor: "text-orange-700 dark:text-orange-400",
            tip: "Ce mois était difficile. Identifie 2 ou 3 dépenses que tu aurais pu éviter. Chaque dollar économisé compte!",
          },
        };
        const { Icon, label, bg, border, iconColor, titleColor, tip } = gradeInfo[grade];

        const catRows = [
          { label: "Nourriture", key: "food", Icon: ShoppingCart, color: "text-red-600 dark:text-red-400" },
          { label: "Vêtements", key: "clothing", Icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400" },
          { label: "Loisirs", key: "leisure", Icon: Zap, color: "text-purple-600 dark:text-purple-400" },
          { label: "Loyer / fixes", key: "rent", Icon: Home, color: "text-gray-600 dark:text-gray-400" },
        ].map(r => ({
          ...r,
          amount: expenses.filter((e: Expense) => e.category === r.key).reduce((s: number, e: Expense) => s + e.amount, 0),
        })).filter(r => r.amount > 0);

        return (
          <Dialog open={showMonthSummary} onOpenChange={setShowMonthSummary}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col" data-testid="dialog-month-summary">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Bilan du mois {student.currentMonth || 1}
                </DialogTitle>
                <DialogDescription>Voici un résumé de ta gestion budgétaire ce mois</DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-1">
                  {/* Grade Banner */}
                  <div className={`rounded-lg border p-4 flex items-start gap-3 ${bg} ${border}`}>
                    <Icon className={`w-7 h-7 shrink-0 mt-0.5 ${iconColor}`} />
                    <div>
                      <p className={`font-black text-lg ${titleColor}`}>{label}</p>
                      <p className="text-sm text-foreground/80 mt-0.5">
                        Score: {score}/7 — {grade === "excellent" ? "Gestion exemplaire" : grade === "tres_bien" ? "Très bonne gestion" : grade === "correct" ? "Gestion acceptable" : "Des améliorations à faire"}
                      </p>
                    </div>
                  </div>

                  {/* Budget Overview */}
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                    <p className="font-bold text-sm flex items-center gap-2"><Wallet className="w-4 h-4" /> Budget du mois</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget total</span>
                        <span className="font-bold">{monthlyBudget.toFixed(2)} $</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-red-500" /> Total dépensé</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{student.spent.toFixed(2)} $</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold flex items-center gap-1"><PiggyBank className="w-3.5 h-3.5 text-green-500" /> Économies ce mois</span>
                        <span className={`font-black ${savingsThisMonth > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {savingsThisMonth.toFixed(2)} $ ({savingsPct.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={Math.min(savingsPct, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground">Objectif recommandé: 20% ou plus</p>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  {catRows.length > 0 && (
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <p className="font-bold text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Dépenses par catégorie</p>
                      <div className="space-y-2">
                        {catRows.map(r => (
                          <div key={r.key} className="flex items-center gap-3">
                            <r.Icon className={`w-4 h-4 shrink-0 ${r.color}`} />
                            <span className="text-sm flex-1">{r.label}</span>
                            <span className="text-sm font-bold">{r.amount.toFixed(2)} $</span>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {totalCatalogAmt > 0 ? Math.round((r.amount / monthlyBudget) * 100) : 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Essential ratio */}
                  {totalCatalogAmt > 0 && (
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <p className="font-bold text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Essentiels vs Plaisirs</p>
                      <div className="flex gap-3">
                        <div className="flex-1 text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <p className="text-2xl font-black text-green-700 dark:text-green-400">{Math.round(essentialRatio * 100)}%</p>
                          <p className="text-xs text-green-700 dark:text-green-400 font-semibold">Essentiels</p>
                        </div>
                        <div className="flex-1 text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{Math.round((1 - essentialRatio) * 100)}%</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Plaisirs</p>
                        </div>
                      </div>
                      {essentialRatio >= 0.7 ? (
                        <p className="text-xs text-green-700 dark:text-green-400">Excellent ratio! Tu priorises bien tes besoins de base.</p>
                      ) : essentialRatio >= 0.5 ? (
                        <p className="text-xs text-amber-700 dark:text-amber-400">Attention: essaie d'augmenter la part des essentiels le mois prochain.</p>
                      ) : (
                        <p className="text-xs text-red-700 dark:text-red-400">Alerte: plus de la moitié de tes achats sont des plaisirs!</p>
                      )}
                    </div>
                  )}

                  {/* Fixed expenses status */}
                  {fixedTotal > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 text-sm">
                      <span className="flex items-center gap-2 font-semibold">
                        <Home className="w-4 h-4" /> Dépenses fixes payées
                      </span>
                      <span className={`font-black ${fixedPaidCount === fixedTotal ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {fixedPaidCount}/{fixedTotal}
                      </span>
                    </div>
                  )}

                  {/* Tip */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted border">
                    <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm mb-0.5">Conseil pour le prochain mois</p>
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setShowMonthSummary(false)} data-testid="button-month-summary-cancel">
                  Annuler
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 font-bold"
                  onClick={() => { setShowMonthSummary(false); newMonthMutation.mutate(); }}
                  disabled={newMonthMutation.isPending}
                  data-testid="button-month-summary-confirm"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {newMonthMutation.isPending ? "En cours..." : "Passer au mois suivant"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
