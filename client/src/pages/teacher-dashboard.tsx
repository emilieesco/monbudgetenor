import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Home, Plus, Send, Gift, Target, Users, Settings, Calendar, ArrowRight, DollarSign, Trophy, Medal, Award, Star, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Class, CustomChallenge, TeacherMessage, SurpriseEvent, ClassChallenge, BonusExpense, Expense } from "@shared/schema";

export default function TeacherDashboard() {
  const { classId } = useParams();
  const [_location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"students" | "challenges" | "messages" | "events" | "leaderboard" | "historique" | "config">("students");
  const [expenseAmounts, setExpenseAmounts] = useState<{ [key: string]: number }>({});
  const [predefinedBudget, setPredefinedBudget] = useState<number | "">(""); 
  
  // Class Challenge form states
  const [classChallengeTitle, setClassChallengeTitle] = useState("");
  const [classChallengeDesc, setClassChallengeDesc] = useState("");
  const [classChallengeType, setClassChallengeType] = useState<"spending" | "savings" | "custom">("savings");
  const [classChallengeTarget, setClassChallengeTarget] = useState("");
  const [classChallengeReward, setClassChallengeReward] = useState("");

  // Form states
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState<"congratulations" | "warning" | "info">("info");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [eventType, setEventType] = useState<"bonus_salary" | "promo" | "emergency_expense">("bonus_salary");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventAmount, setEventAmount] = useState("");
  const [expenseStudentId, setExpenseStudentId] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<"transport" | "education" | "health" | "entertainment" | "utilities" | "food" | "clothing" | "emergency" | "other">("other");

  // Queries
  const classQuery = useQuery({ queryKey: ["/api/classes", classId] });
  const studentsQuery = useQuery({
    queryKey: ["/api/classes", classId, "students"],
  });
  const customChallengesQuery = useQuery({
    queryKey: ["/api/custom-challenges", classId],
  });
  const messagesQuery = useQuery({
    queryKey: ["/api/messages/class", classId],
  });
  const eventsQuery = useQuery({
    queryKey: ["/api/surprise-events", classId],
  });
  const classChallengesQuery = useQuery({
    queryKey: ["/api/classes", classId, "challenges"],
  });
  const leaderboardQuery = useQuery({
    queryKey: ["/api/classes", classId, "leaderboard"],
  });
  const classBonusExpensesQuery = useQuery({
    queryKey: ["/api/classes", classId, "bonus-expenses"],
  });
  const classExpensesQuery = useQuery({
    queryKey: ["/api/classes", classId, "expenses"],
  });

  // Mutations
  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/custom-challenges", {
        classId,
        title: challengeTitle,
        description: challengeDesc,
        type: "custom",
        targetValue: parseFloat(challengeTarget),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-challenges", classId] });
      setChallengeTitle("");
      setChallengeDesc("");
      setChallengeTarget("");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/messages", {
        classId,
        studentId: selectedStudentId || undefined,
        content: messageContent,
        type: messageType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/class", classId] });
      setMessageContent("");
      setSelectedStudentId("");
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/surprise-events", {
        classId,
        type: eventType,
        title: eventTitle,
        description: eventDesc,
        amount: parseFloat(eventAmount),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surprise-events", classId] });
      setEventType("bonus_salary");
      setEventTitle("");
      setEventDesc("");
      setEventAmount("");
      toast({
        title: "Événement créé!",
        description: "L'événement surprise a été créé avec succès.",
      });
    },
    onError: (error) => {
      console.error("Event creation error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement.",
        variant: "destructive",
      });
    },
  });

  const applyEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest("PATCH", `/api/surprise-events/${eventId}/apply`, {
        studentId: selectedStudentId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surprise-events", classId] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "students"] });
      setSelectedStudentId("");
      toast({
        title: "Événement appliqué!",
        description: "L'événement a été appliqué à l'élève.",
      });
    },
  });

  const applyEventToAllMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest("PATCH", `/api/surprise-events/${eventId}/apply-all`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/surprise-events", classId] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "students"] });
      toast({
        title: "Événement appliqué à toute la classe!",
        description: `${data.appliedTo} élève(s) ont reçu cet événement.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer l'événement à la classe.",
        variant: "destructive",
      });
    },
  });

  const updateExpensesMutation = useMutation({
    mutationFn: async (amounts: { [key: string]: number }) => {
      const res = await apiRequest("PATCH", `/api/classes/${classId}/expenses`, amounts);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId] });
      toast({
        title: "Dépenses mises à jour!",
        description: "Les montants des dépenses ont été sauvegardés.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    },
  });

  const updatePredefinedBudgetMutation = useMutation({
    mutationFn: async (budget: number) => {
      const res = await apiRequest("PATCH", `/api/classes/${classId}/predefined-budget`, { predefinedBudget: budget });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId] });
      toast({
        title: "Budget prédéfini sauvegardé!",
        description: "Le budget prédéfini pour les élèves a été mis à jour.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le budget prédéfini.",
        variant: "destructive",
      });
    },
  });

  const newMonthMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/classes/${classId}/new-month`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "students"] });
      toast({
        title: "Nouveau mois commencé!",
        description: `${data.studentsUpdated} élève(s) ont reçu leur budget mensuel.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de démarrer un nouveau mois.",
        variant: "destructive",
      });
    },
  });

  const addStudentExpenseMutation = useMutation({
    mutationFn: async (data: { studentId: string; name: string; amount: number; category: string }) => {
      const res = await apiRequest("POST", `/api/students/${data.studentId}/manual-expense`, {
        name: data.name,
        amount: data.amount,
        category: data.category,
      });
      return { expense: await res.json(), studentId: data.studentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", data.studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", data.studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-expenses", data.studentId] });
      setExpenseStudentId("");
      setExpenseName("");
      setExpenseAmount("");
      toast({
        title: "Dépense ajoutée!",
        description: "La dépense a été ajoutée au budget de l'élève.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense.",
        variant: "destructive",
      });
    },
  });

  const deleteBonusExpenseMutation = useMutation({
    mutationFn: async (data: { expenseId: string; studentId: string }) => {
      const res = await apiRequest("DELETE", `/api/bonus-expenses/${data.expenseId}`);
      return { result: await res.json(), studentId: data.studentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "bonus-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", data.studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-expenses", data.studentId] });
      toast({
        title: "Dépense supprimée!",
        description: "La dépense a été supprimée et le budget remboursé.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense.",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (data: { expenseId: string; studentId: string }) => {
      const res = await apiRequest("DELETE", `/api/expenses/${data.expenseId}`);
      return { result: await res.json(), studentId: data.studentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", data.studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", data.studentId] });
      toast({
        title: "Dépense supprimée!",
        description: "La dépense a été supprimée et le budget remboursé.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense.",
        variant: "destructive",
      });
    },
  });

  const createClassChallengeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/class-challenges", {
        classId,
        title: classChallengeTitle,
        description: classChallengeDesc,
        type: classChallengeType,
        targetValue: parseFloat(classChallengeTarget),
        reward: classChallengeReward || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "challenges"] });
      setClassChallengeTitle("");
      setClassChallengeDesc("");
      setClassChallengeTarget("");
      setClassChallengeReward("");
      toast({
        title: "Défi de classe créé!",
        description: "Le défi a été créé pour toute la classe.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le défi.",
        variant: "destructive",
      });
    },
  });

  const deleteClassChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await apiRequest("DELETE", `/api/class-challenges/${challengeId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", classId, "challenges"] });
      toast({
        title: "Défi supprimé",
        description: "Le défi a été supprimé.",
      });
    },
  });

  const classData = classQuery.data as Class | undefined;
  const students = studentsQuery.data as Student[] || [];
  const challenges = customChallengesQuery.data as CustomChallenge[] || [];
  const messages = messagesQuery.data as TeacherMessage[] || [];
  const events = eventsQuery.data as SurpriseEvent[] || [];
  const classChallenges = classChallengesQuery.data as ClassChallenge[] || [];
  const leaderboard = leaderboardQuery.data as Array<{studentId: string; name: string; savings: number; badgeCount: number; challengesCompleted: number}> || [];
  const classBonusExpenses = classBonusExpensesQuery.data as Array<BonusExpense & { studentName: string }> || [];
  const classExpenses = classExpensesQuery.data as Array<Expense & { studentName: string }> || [];

  if (!classData) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Tableau de Bord - {classData.teacherName}</h1>
            <p className="text-lg text-muted-foreground">Code: <span className="font-mono font-bold">{classData.code}</span></p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              onClick={() => newMonthMutation.mutate()}
              disabled={newMonthMutation.isPending || students.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              data-testid="button-class-new-month"
            >
              <Calendar className="w-5 h-5" />
              {newMonthMutation.isPending ? "En cours..." : "Nouveau Mois"}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Retour
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["students", "challenges", "messages", "events", "leaderboard", "historique", "config"].map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => {
                setActiveTab(tab as any);
                if (tab === "config" && classData) {
                  setExpenseAmounts({ ...classData.expenseAmounts });
                  setPredefinedBudget(classData.predefinedBudget || "");
                }
              }}
              className="flex items-center gap-2"
              data-testid={`tab-${tab}`}
            >
              {tab === "students" && <Users className="w-4 h-4" />}
              {tab === "challenges" && <Target className="w-4 h-4" />}
              {tab === "messages" && <Send className="w-4 h-4" />}
              {tab === "events" && <Gift className="w-4 h-4" />}
              {tab === "leaderboard" && <Trophy className="w-4 h-4" />}
              {tab === "historique" && <Trash2 className="w-4 h-4" />}
              {tab === "config" && <Settings className="w-4 h-4" />}
              {tab === "students" && "Étudiants"}
              {tab === "challenges" && "Défis"}
              {tab === "messages" && "Messages"}
              {tab === "events" && "Événements"}
              {tab === "leaderboard" && "Classement"}
              {tab === "historique" && "Historique"}
              {tab === "config" && "Configuration"}
            </Button>
          ))}
        </div>

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Étudiants de la Classe ({students.length})</h2>
            
            {/* Add Expense to Student Form */}
            {students.length > 0 && (
              <Card className="p-6 border-primary/30">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold">Ajouter une Dépense à un Élève</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-student">Élève</Label>
                    <select
                      id="expense-student"
                      value={expenseStudentId}
                      onChange={(e) => setExpenseStudentId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      data-testid="select-expense-student"
                    >
                      <option value="">Sélectionner un élève</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-name-teacher">Description</Label>
                    <Input
                      id="expense-name-teacher"
                      placeholder="Ex: Sortie scolaire"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      data-testid="input-expense-name-teacher"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount-teacher">Montant ($)</Label>
                    <Input
                      id="expense-amount-teacher"
                      type="number"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      data-testid="input-expense-amount-teacher"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-category-teacher">Catégorie</Label>
                    <select
                      id="expense-category-teacher"
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as "transport" | "education" | "health" | "entertainment" | "utilities" | "food" | "clothing" | "emergency" | "other")}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      data-testid="select-expense-category-teacher"
                    >
                      <option value="transport">Transport</option>
                      <option value="education">Éducation</option>
                      <option value="health">Santé</option>
                      <option value="entertainment">Divertissement</option>
                      <option value="utilities">Services publics</option>
                      <option value="food">Nourriture</option>
                      <option value="clothing">Vêtements</option>
                      <option value="emergency">Urgence</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        const amount = parseFloat(expenseAmount);
                        if (expenseStudentId && expenseName.trim() && amount > 0) {
                          addStudentExpenseMutation.mutate({
                            studentId: expenseStudentId,
                            name: expenseName.trim(),
                            amount,
                            category: expenseCategory,
                          });
                        }
                      }}
                      disabled={addStudentExpenseMutation.isPending || !expenseStudentId || !expenseName.trim() || !expenseAmount}
                      className="w-full"
                      data-testid="button-add-student-expense"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            
            {students.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucun étudiant n'a rejoint la classe pour le moment.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {students.map(student => (
                  <Card key={student.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{student.name}</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Budget Actuel</p>
                            <p className="font-bold">${student.budget}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Dépensé</p>
                            <p className="font-bold text-destructive">${student.spent}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Épargne</p>
                            <p className="font-bold text-purple-600">${student.savings}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">{Math.round(100 - (student.spent / student.budget * 100))}% restant</Badge>
                      </div>
                    </div>
                    {student.budgetHistory && student.budgetHistory.length > 1 && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Historique des Budgets ({student.budgetHistory.length})</p>
                        <div className="space-y-1">
                          {student.budgetHistory.map((h, i) => {
                            const date = typeof h.date === 'string' ? new Date(h.date) : h.date;
                            return (
                              <div key={i} className="text-xs flex justify-between p-1.5 bg-muted rounded">
                                <span>Essai {student.budgetHistory!.length - i}</span>
                                <span className="font-semibold">${h.budget}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <div className="space-y-8">
            {/* Create Class Challenge */}
            <Card className="p-6 border-primary/30">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Créer un Défi de Classe</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class-challenge-title">Titre du défi</Label>
                  <Input
                    id="class-challenge-title"
                    placeholder="Ex: Défi Épargne Collective"
                    value={classChallengeTitle}
                    onChange={(e) => setClassChallengeTitle(e.target.value)}
                    data-testid="input-class-challenge-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-challenge-type">Type de défi</Label>
                  <select
                    id="class-challenge-type"
                    value={classChallengeType}
                    onChange={(e) => setClassChallengeType(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    data-testid="select-class-challenge-type"
                  >
                    <option value="savings">Objectif d'épargne</option>
                    <option value="spending">Limite de dépenses</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="class-challenge-desc">Description</Label>
                  <Input
                    id="class-challenge-desc"
                    placeholder="Décris le défi..."
                    value={classChallengeDesc}
                    onChange={(e) => setClassChallengeDesc(e.target.value)}
                    data-testid="input-class-challenge-desc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-challenge-target">Valeur cible ($)</Label>
                  <Input
                    id="class-challenge-target"
                    type="number"
                    placeholder="100"
                    value={classChallengeTarget}
                    onChange={(e) => setClassChallengeTarget(e.target.value)}
                    data-testid="input-class-challenge-target"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-challenge-reward">Récompense (optionnel)</Label>
                  <Input
                    id="class-challenge-reward"
                    placeholder="Ex: Bonus de 50$"
                    value={classChallengeReward}
                    onChange={(e) => setClassChallengeReward(e.target.value)}
                    data-testid="input-class-challenge-reward"
                  />
                </div>
              </div>
              <Button
                onClick={() => createClassChallengeMutation.mutate()}
                disabled={!classChallengeTitle || !classChallengeDesc || !classChallengeTarget || createClassChallengeMutation.isPending}
                className="mt-4 flex items-center gap-2"
                data-testid="button-create-class-challenge"
              >
                <Plus className="w-4 h-4" />
                {createClassChallengeMutation.isPending ? "Création..." : "Créer le Défi"}
              </Button>
            </Card>

            {/* Class Challenges List */}
            {classChallenges.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Défis de Classe Actifs
                </h3>
                <div className="space-y-3">
                  {classChallenges.map(ch => (
                    <div key={ch.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{ch.title}</p>
                          <Badge variant="secondary" size="sm">
                            {ch.type === "savings" ? "Épargne" : ch.type === "spending" ? "Dépenses" : "Personnalisé"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{ch.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Objectif: ${ch.targetValue}</span>
                          {ch.reward && <span>Récompense: {ch.reward}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="default">{ch.completedBy.length}/{students.length} complété</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteClassChallengeMutation.mutate(ch.id)}
                          data-testid={`button-delete-challenge-${ch.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Legacy Custom Challenges */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Créer un Défi Personnalisé (Ancien système)</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="challenge-title">Titre du défi</Label>
                  <Input
                    id="challenge-title"
                    placeholder="Ex: Économise 100$ cette semaine"
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    data-testid="input-challenge-title"
                  />
                </div>
                <div>
                  <Label htmlFor="challenge-desc">Description</Label>
                  <Input
                    id="challenge-desc"
                    placeholder="Explique le défi en détail"
                    value={challengeDesc}
                    onChange={(e) => setChallengeDesc(e.target.value)}
                    data-testid="input-challenge-desc"
                  />
                </div>
                <div>
                  <Label htmlFor="challenge-target">Valeur cible</Label>
                  <Input
                    id="challenge-target"
                    type="number"
                    placeholder="100"
                    value={challengeTarget}
                    onChange={(e) => setChallengeTarget(e.target.value)}
                    data-testid="input-challenge-target"
                  />
                </div>
                <Button
                  onClick={() => createChallengeMutation.mutate()}
                  disabled={!challengeTitle || !challengeDesc || !challengeTarget || createChallengeMutation.isPending}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  Créer le Défi
                </Button>
              </div>
            </Card>

            {challenges.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Défis Personnalisés Actifs</h3>
                <div className="space-y-3">
                  {challenges.map(ch => (
                    <div key={ch.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{ch.title}</p>
                        <p className="text-sm text-muted-foreground">{ch.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Objectif: {ch.targetValue}</p>
                      </div>
                      <Badge>{ch.completedBy.length} complété{ch.completedBy.length !== 1 ? "s" : ""}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Envoyer un Message</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message-type">Type de message</Label>
                  <select
                    id="message-type"
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    data-testid="select-message-type"
                  >
                    <option value="congratulations">Félicitations</option>
                    <option value="warning">Avertissement</option>
                    <option value="info">Information</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="message-student">Étudiant (optionnel - laisse vide pour toute la classe)</Label>
                  <select
                    id="message-student"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    data-testid="select-message-student"
                  >
                    <option value="">Toute la classe</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="message-content">Message</Label>
                  <textarea
                    id="message-content"
                    placeholder="Écris ton message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-24"
                    data-testid="input-message-content"
                  />
                </div>
                <Button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!messageContent || sendMessageMutation.isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </Button>
              </div>
            </Card>

            {messages.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Messages Envoyés</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map(msg => (
                    <div key={msg.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={msg.type === "congratulations" ? "default" : msg.type === "warning" ? "destructive" : "secondary"}>
                          {msg.type === "congratulations" ? "Félicitations" : msg.type === "warning" ? "Avertissement" : "Info"}
                        </Badge>
                        {msg.studentId && <p className="text-xs text-muted-foreground">{students.find(s => s.id === msg.studentId)?.name}</p>}
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Créer un Événement Surprise</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-type">Type d'événement</Label>
                  <select
                    id="event-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    data-testid="select-event-type"
                  >
                    <option value="bonus_salary">Salaire Bonus</option>
                    <option value="emergency_expense">Dépense d'Urgence</option>
                    <option value="promo">Promo Magasin</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="event-title">Titre</Label>
                  <Input
                    id="event-title"
                    placeholder="Ex: Bonus travail d'été"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    data-testid="input-event-title"
                  />
                </div>
                <div>
                  <Label htmlFor="event-desc">Description</Label>
                  <Input
                    id="event-desc"
                    placeholder="Détails de l'événement"
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    data-testid="input-event-desc"
                  />
                </div>
                <div>
                  <Label htmlFor="event-amount">Montant ($)</Label>
                  <Input
                    id="event-amount"
                    type="number"
                    placeholder="50"
                    value={eventAmount}
                    onChange={(e) => setEventAmount(e.target.value)}
                    data-testid="input-event-amount"
                  />
                </div>
                <Button
                  onClick={() => createEventMutation.mutate()}
                  disabled={!eventTitle || !eventDesc || !eventAmount || createEventMutation.isPending}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Gift className="w-4 h-4" />
                  Créer l'Événement
                </Button>
              </div>
            </Card>

            {events.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Événements Actifs</h3>
                <div className="space-y-3">
                  {events.map(event => (
                    <div key={event.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <p className="text-sm font-bold mt-1">
                            {event.type === "bonus_salary" && <span className="text-green-600">+ ${event.amount}</span>}
                            {event.type === "emergency_expense" && <span className="text-destructive">- ${event.amount}</span>}
                            {event.type === "promo" && <span className="text-blue-600">Promo ${event.amount}</span>}
                          </p>
                        </div>
                      </div>
                      {(event.type === "bonus_salary" || event.type === "emergency_expense") && (
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => applyEventToAllMutation.mutate(event.id)}
                            disabled={applyEventToAllMutation.isPending || students.length === 0}
                            className="bg-purple-600 hover:bg-purple-700"
                            data-testid={`button-apply-all-${event.id}`}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Appliquer à toute la classe ({students.length})
                          </Button>
                          <span className="text-muted-foreground text-sm">ou</span>
                          <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="px-2 py-1 border border-border rounded text-sm bg-background"
                            data-testid={`select-event-student-${event.id}`}
                          >
                            <option value="">Un élève...</option>
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          {selectedStudentId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applyEventMutation.mutate(event.id)}
                              disabled={applyEventMutation.isPending}
                              data-testid={`button-apply-one-${event.id}`}
                            >
                              Appliquer
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="space-y-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h2 className="text-2xl font-bold">Classement de la Classe</h2>
              </div>
              
              {leaderboard.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucun étudiant dans la classe pour le moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry.studentId} 
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        index === 0 ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300" :
                        index === 1 ? "bg-gray-100 dark:bg-gray-800 border border-gray-300" :
                        index === 2 ? "bg-orange-100 dark:bg-orange-900/30 border border-orange-300" :
                        "bg-muted"
                      }`}
                      data-testid={`leaderboard-entry-${index}`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center font-bold text-lg">
                        {index === 0 && <Medal className="w-8 h-8 text-yellow-500" />}
                        {index === 1 && <Medal className="w-8 h-8 text-gray-400" />}
                        {index === 2 && <Medal className="w-8 h-8 text-orange-500" />}
                        {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{entry.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {entry.badgeCount} badge{entry.badgeCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {entry.challengesCompleted} défi{entry.challengesCompleted !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${entry.savings.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Épargne totale</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            
            {/* Stats Summary */}
            {leaderboard.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-3xl font-bold">{leaderboard[0]?.name || "-"}</p>
                  <p className="text-muted-foreground">Meilleur épargnant</p>
                </Card>
                <Card className="p-6 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-3xl font-bold">
                    ${leaderboard.reduce((acc, e) => acc + e.savings, 0).toFixed(2)}
                  </p>
                  <p className="text-muted-foreground">Épargne totale de la classe</p>
                </Card>
                <Card className="p-6 text-center">
                  <Award className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-3xl font-bold">
                    {leaderboard.reduce((acc, e) => acc + e.badgeCount, 0)}
                  </p>
                  <p className="text-muted-foreground">Badges gagnés</p>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Historique Tab */}
        {activeTab === "historique" && (
          <div className="space-y-8">
            {/* Bonus Expenses (Teacher-added) */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Dépenses Ajoutées par l'Enseignant</h2>
                <Badge variant="secondary">{classBonusExpenses.length}</Badge>
              </div>
              
              {classBonusExpenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune dépense ajoutée par l'enseignant.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {classBonusExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{expense.title}</span>
                          <Badge variant="outline">{expense.studentName}</Badge>
                          {expense.category && <Badge variant="secondary">{expense.category}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.createdAt).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-destructive">${expense.amount.toFixed(2)}</span>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteBonusExpenseMutation.mutate({ expenseId: expense.id, studentId: expense.studentId })}
                          disabled={deleteBonusExpenseMutation.isPending}
                          data-testid={`button-delete-bonus-${expense.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Catalog Expenses (Student purchases) */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold">Achats des Élèves (Catalogue)</h2>
                <Badge variant="secondary">{classExpenses.length}</Badge>
              </div>
              
              {classExpenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun achat effectué par les élèves.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {classExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{expense.message}</span>
                          <Badge variant="outline">{expense.studentName}</Badge>
                          <Badge variant={expense.isEssential ? "default" : "destructive"}>
                            {expense.isEssential ? "Essentiel" : "Non-essentiel"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} - {new Date(expense.timestamp).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-destructive">${expense.amount.toFixed(2)}</span>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteExpenseMutation.mutate({ expenseId: expense.id, studentId: expense.studentId })}
                          disabled={deleteExpenseMutation.isPending}
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="space-y-8">
            {/* Budget Prédéfini */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Budget Prédéfini</h2>
              <p className="text-muted-foreground mb-4">
                Définissez le montant que les élèves recevront s'ils choisissent le "Budget Prédéfini".
              </p>
              
              <div className="flex items-end gap-4 mb-4">
                <div className="flex-1 max-w-xs space-y-2">
                  <Label htmlFor="predefined-budget">Montant du budget prédéfini ($)</Label>
                  <Input
                    id="predefined-budget"
                    type="number"
                    placeholder={`Suggéré: ${Math.round(Object.values(expenseAmounts).reduce((a, b) => a + b, 0) * 1.5)}`}
                    value={predefinedBudget}
                    onChange={(e) => setPredefinedBudget(e.target.value ? parseFloat(e.target.value) : "")}
                    data-testid="input-predefined-budget"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (typeof predefinedBudget === "number" && predefinedBudget > 0) {
                      updatePredefinedBudgetMutation.mutate(predefinedBudget);
                    }
                  }}
                  disabled={updatePredefinedBudgetMutation.isPending || !predefinedBudget}
                  data-testid="button-save-predefined-budget"
                >
                  Sauvegarder
                </Button>
              </div>

              {classData?.predefinedBudget && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Budget prédéfini actuel:</p>
                  <p className="text-3xl font-bold text-primary">${classData.predefinedBudget}</p>
                </div>
              )}
              {!classData?.predefinedBudget && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Aucun budget prédéfini défini.</p>
                  <p className="text-sm">Si non défini, le budget sera calculé automatiquement: <strong>${Math.round(Object.values(expenseAmounts).reduce((a, b) => a + b, 0) * 1.5)}</strong> (total dépenses × 1.5)</p>
                </div>
              )}
            </Card>

            {/* Dépenses Fixes */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Dépenses Fixes Mensuelles</h2>
              <p className="text-muted-foreground mb-6">
                Modifiez les montants des dépenses fixes que les élèves devront payer.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(expenseAmounts).map(([name, amount]) => (
                  <div key={name} className="space-y-2">
                    <Label htmlFor={`expense-${name}`}>{name}</Label>
                    <Input
                      id={`expense-${name}`}
                      type="number"
                      value={amount}
                      onChange={(e) => setExpenseAmounts(prev => ({
                        ...prev,
                        [name]: parseFloat(e.target.value) || 0
                      }))}
                      data-testid={`input-expense-${name}`}
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">Total dépenses fixes:</p>
                <p className="text-2xl font-bold">${Object.values(expenseAmounts).reduce((a, b) => a + b, 0)}</p>
              </div>

              <Button
                onClick={() => updateExpensesMutation.mutate(expenseAmounts)}
                disabled={updateExpensesMutation.isPending}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Sauvegarder les Dépenses
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
