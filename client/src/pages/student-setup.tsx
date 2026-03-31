import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Home, Wifi, Phone, Zap, Car, Shield, Fuel, Utensils, PartyPopper } from "lucide-react";
import type { Class } from "@shared/schema";

const SCENARIOS = {
  student: { budget: 1800, name: "Étudiant", desc: "Budget étudiant limité" },
  worker: { budget: 2400, name: "Travailleur", desc: "Salaire stable" },
};

const EXPENSE_ICONS: Record<string, any> = {
  "Loyer": Home,
  "Internet": Wifi,
  "Téléphone": Phone,
  "Hydro": Zap,
  "Assurance Voiture": Car,
  "Assurance Maison": Shield,
  "Essence": Fuel,
  "Nourriture": Utensils,
  "Sortie": PartyPopper,
};

interface CustomExpense {
  enabled: boolean;
  amount: number;
}

export default function StudentSetup() {
  const [_location, navigate] = useLocation();
  const classCode = new URLSearchParams(window.location.search).get("classCode");
  const nameParam = decodeURIComponent(new URLSearchParams(window.location.search).get("name") || "");
  const [studentName, setStudentName] = useState(nameParam);
  const [mode, setMode] = useState<"predefined" | "custom" | "scenario">("predefined");
  const [customBudget, setCustomBudget] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<string>("student");
  const [customExpenses, setCustomExpenses] = useState<Record<string, CustomExpense>>({});
  
  const classQuery = useQuery({
    queryKey: ["/api/classes/code", classCode],
    enabled: !!classCode,
  });
  
  const classData = classQuery.data as Class | undefined;
  
  const getInitialExpenses = () => {
    if (!classData?.expenseAmounts) return {};
    const initialExpenses: Record<string, CustomExpense> = {};
    Object.entries(classData.expenseAmounts).forEach(([key, value]) => {
      initialExpenses[key] = { enabled: true, amount: value };
    });
    return initialExpenses;
  };

  useEffect(() => {
    if (classData?.expenseAmounts) {
      setCustomExpenses(getInitialExpenses());
    }
  }, [classData]);

  const handleModeChange = (newMode: "predefined" | "custom" | "scenario") => {
    setMode(newMode);
    if (newMode === "custom") {
      setCustomExpenses(getInitialExpenses());
    } else {
      setCustomBudget("");
    }
  };

  const [joinError, setJoinError] = useState("");

  const joinMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/students/join", data);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de l'inscription");
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      navigate(`/student/${data.id}`);
    },
    onError: (err: any) => {
      setJoinError(err.message || "Erreur lors de l'inscription. Réessaie.");
    },
  });

  const handleExpenseToggle = (key: string, enabled: boolean) => {
    setCustomExpenses(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled }
    }));
  };

  const handleExpenseAmountChange = (key: string, amount: number) => {
    const validAmount = isNaN(amount) ? 0 : Math.max(0, amount);
    setCustomExpenses(prev => ({
      ...prev,
      [key]: { ...prev[key], amount: validAmount }
    }));
  };

  const getActiveCustomExpenses = (): Record<string, number> => {
    const result: Record<string, number> = {};
    Object.entries(customExpenses).forEach(([key, value]) => {
      if (value.enabled && value.amount > 0) {
        result[key] = value.amount;
      }
    });
    return result;
  };

  const handleJoin = () => {
    if (!studentName) {
      alert("Entre ton prénom");
      return;
    }

    const calculatedBudget = Math.round(Object.values(classData?.expenseAmounts || {}).reduce((a: any, b: any) => a + b, 0) * 1.5) || 50;
    const defaultBudget = classData?.predefinedBudget || calculatedBudget;
    let budget = defaultBudget;
    let scenario: string | undefined = undefined;

    interface JoinPayload {
      name: string;
      classCode: string | null;
      budget: number;
      scenario?: string;
      customExpenses?: Record<string, number>;
    }

    const payload: JoinPayload = {
      name: studentName,
      classCode,
      budget,
    };

    if (mode === "custom") {
      payload.budget = parseInt(customBudget) || 50;
      payload.customExpenses = getActiveCustomExpenses();
    } else if (mode === "scenario") {
      payload.budget = SCENARIOS[selectedScenario as keyof typeof SCENARIOS]?.budget || 50;
      payload.scenario = selectedScenario;
    }

    joinMutation.mutate(payload);
  };

  if (!classData) {
    return <div className="p-8 text-center">Chargement de la classe...</div>;
  }

  const calculatedBudget = Math.round(Object.values(classData.expenseAmounts).reduce((a: any, b: any) => a + b, 0) * 1.5) || 50;
  const defaultBudget = classData.predefinedBudget || calculatedBudget;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold text-primary mb-2">
          Choisis ton Mode Budgétaire
        </h1>
        <p className="text-muted-foreground mb-8">Classe: {classData.teacherName}</p>

        <Card className="p-8">
          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <Label htmlFor="name">Ton Prénom</Label>
              <Input
                id="name"
                placeholder="Ex: Jean"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            {/* Mode Selection */}
            <div>
              <Label className="mb-4 block">Choisir ton Mode Budgétaire</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prédéfini */}
                <button
                  onClick={() => handleModeChange("predefined")}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    mode === "predefined"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid="button-mode-predefined"
                >
                  <p className="font-semibold mb-1">Budget Prédéfini</p>
                  <p className="text-sm text-muted-foreground mb-3">Défini par ton prof</p>
                  <p className="text-lg font-bold text-primary">${defaultBudget}</p>
                </button>

                {/* Personnalisé */}
                <button
                  onClick={() => handleModeChange("custom")}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    mode === "custom"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid="button-mode-custom"
                >
                  <p className="font-semibold mb-1">Budget Personnel</p>
                  <p className="text-sm text-muted-foreground mb-3">Ta propre réalité</p>
                  <p className="text-lg font-bold text-primary">Personnalisé</p>
                </button>

                {/* Scénario */}
                <button
                  onClick={() => handleModeChange("scenario")}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    mode === "scenario"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid="button-mode-scenario"
                >
                  <p className="font-semibold mb-1">Profils Réalistes</p>
                  <p className="text-sm text-muted-foreground mb-3">Choisir un profil</p>
                  <p className="text-lg font-bold text-primary">Scénario</p>
                </button>
              </div>
            </div>

            {/* Mode-specific content */}
            {mode === "custom" && (
              <div className="space-y-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <Label htmlFor="budget">Ton Budget Personnel ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Ex: 1500"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(e.target.value)}
                    data-testid="input-custom-budget"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Entre le montant mensuel qui correspond à ta réalité
                  </p>
                </div>
                
                <div>
                  <Label className="mb-3 block">Personnalise tes dépenses fixes</Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Active ou désactive les dépenses selon ta situation et ajuste les montants
                  </p>
                  <div className="space-y-3">
                    {Object.entries(customExpenses).map(([key, value]) => {
                      const IconComponent = EXPENSE_ICONS[key] || Home;
                      return (
                        <div 
                          key={key} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            value.enabled 
                              ? "bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700" 
                              : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                          }`}
                        >
                          <Switch
                            checked={value.enabled}
                            onCheckedChange={(checked) => handleExpenseToggle(key, checked)}
                            data-testid={`switch-expense-${key.toLowerCase().replace(/\s/g, '-')}`}
                          />
                          <IconComponent className={`w-5 h-5 ${value.enabled ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`flex-1 font-medium ${!value.enabled && "text-muted-foreground"}`}>
                            {key}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={value.amount}
                              onChange={(e) => handleExpenseAmountChange(key, parseFloat(e.target.value) || 0)}
                              disabled={!value.enabled}
                              className="w-24 h-8 text-right"
                              data-testid={`input-expense-${key.toLowerCase().replace(/\s/g, '-')}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {Object.keys(customExpenses).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total dépenses fixes:</span>
                        <span className="text-lg font-bold text-primary">
                          ${Object.entries(customExpenses)
                            .filter(([_, v]) => v.enabled)
                            .reduce((sum, [_, v]) => sum + v.amount, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === "scenario" && (
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <Label className="mb-4">Profil</Label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(SCENARIOS).map(([key, { budget, name, desc }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedScenario(key)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        selectedScenario === key
                          ? "border-green-600 bg-green-100 dark:bg-green-900"
                          : "border-green-200 dark:border-green-800 hover:border-green-400"
                      }`}
                    >
                      <p className="font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">
                        ${budget}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "predefined" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold mb-2">Budget: ${defaultBudget}</p>
                <p className="text-sm text-muted-foreground">Dépenses fixées par ton enseignant</p>
              </div>
            )}

            {joinError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{joinError}</p>
              </div>
            )}

            <Button
              onClick={() => { setJoinError(""); handleJoin(); }}
              disabled={
                joinMutation.isPending ||
                !studentName ||
                (mode === "custom" && !customBudget) ||
                (mode === "scenario" && !selectedScenario)
              }
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-join-class"
            >
              {joinMutation.isPending ? "Connexion..." : "Rejoindre la Classe"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
