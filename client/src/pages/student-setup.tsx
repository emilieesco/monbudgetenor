import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { Class } from "@shared/schema";

const SCENARIOS = {
  student: { budget: 1800, name: "Étudiant", desc: "Budget étudiant limité" },
  worker: { budget: 2400, name: "Travailleur", desc: "Salaire stable" },
};

export default function StudentSetup() {
  const [_location, navigate] = useLocation();
  const classCode = new URLSearchParams(window.location.search).get("classCode");
  const nameParam = decodeURIComponent(new URLSearchParams(window.location.search).get("name") || "");
  const [studentName, setStudentName] = useState(nameParam);
  const [mode, setMode] = useState<"predefined" | "custom" | "scenario">("predefined");
  const [customBudget, setCustomBudget] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<string>("student");
  
  const classQuery = useQuery({
    queryKey: ["/api/classes/code", classCode],
    enabled: !!classCode,
  });

  const joinMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/students/join", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      navigate(`/student/${data.id}`);
    },
  });

  const classData = classQuery.data as Class | undefined;

  const handleJoin = () => {
    if (!studentName) {
      alert("Entre ton prénom");
      return;
    }

    const calculatedBudget = Math.round(Object.values(classData?.expenseAmounts || {}).reduce((a: any, b: any) => a + b, 0) * 1.5) || 50;
    const defaultBudget = classData?.predefinedBudget || calculatedBudget;
    let budget = defaultBudget;
    let scenario = undefined;

    if (mode === "custom") {
      budget = parseInt(customBudget) || 50;
    } else if (mode === "scenario") {
      budget = SCENARIOS[selectedScenario as keyof typeof SCENARIOS]?.budget || 50;
      scenario = selectedScenario;
    }

    joinMutation.mutate({
      name: studentName,
      classCode,
      budget,
      scenario,
    });
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
                  onClick={() => setMode("predefined")}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    mode === "predefined"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold mb-1">Budget Prédéfini</p>
                  <p className="text-sm text-muted-foreground mb-3">Défini par ton prof</p>
                  <p className="text-lg font-bold text-primary">${defaultBudget}</p>
                </button>

                {/* Personnalisé */}
                <button
                  onClick={() => setMode("custom")}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    mode === "custom"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold mb-1">Budget Personnel</p>
                  <p className="text-sm text-muted-foreground mb-3">Ta propre réalité</p>
                  <p className="text-lg font-bold text-primary">Personnalisé</p>
                </button>

                {/* Scénario */}
                <button
                  onClick={() => setMode("scenario")}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    mode === "scenario"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold mb-1">Profils Réalistes</p>
                  <p className="text-sm text-muted-foreground mb-3">Choisir un profil</p>
                  <p className="text-lg font-bold text-primary">Scénario</p>
                </button>
              </div>
            </div>

            {/* Mode-specific content */}
            {mode === "custom" && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Label htmlFor="budget">Ton Budget Personnel ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Ex: 75"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Entre le montant qui correspond à ta réalité
                </p>
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

            <Button
              onClick={handleJoin}
              disabled={
                joinMutation.isPending ||
                !studentName ||
                (mode === "custom" && !customBudget) ||
                (mode === "scenario" && !selectedScenario)
              }
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-join-class"
            >
              Rejoindre la Classe
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
