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
  student: { budget: 40, name: "Étudiant" },
  worker: { budget: 80, name: "Travailleur" },
  parent: { budget: 150, name: "Parent" },
};

export default function StudentSetup() {
  const [_location, navigate] = useLocation();
  const classCode = new URLSearchParams(window.location.search).get("classCode");
  const [studentName, setStudentName] = useState("");
  const [customBudget, setCustomBudget] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  
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
  const mode = classData?.mode || "predefined";

  const handleJoin = (budget: number, scenario?: string) => {
    if (!studentName) {
      alert("Entre ton prénom");
      return;
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold text-primary mb-2">
          Rejoindre {classData.teacherName}'s Classe
        </h1>
        <p className="text-muted-foreground mb-8">Code: {classCode}</p>

        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Ton Prénom</Label>
              <Input
                id="name"
                placeholder="Ex: Jean"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            {mode === "predefined" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold mb-2">Budget: ${classData.expenseAmounts["Loyer"] ? Math.round(Object.values(classData.expenseAmounts).reduce((a: any, b: any) => a + b, 0) * 1.5) : 50}</p>
                <p className="text-sm text-muted-foreground">Dépenses fixées par ton enseignant</p>
              </div>
            )}

            {mode === "custom" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Ton Budget Personnel ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Ex: 75"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Entre le montant qui correspond à ta réalité
                  </p>
                </div>
              </div>
            )}

            {mode === "scenario" && (
              <div className="space-y-4">
                <Label>Choisis ton Profil</Label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(SCENARIOS).map(([key, { budget, name }]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedScenario(key)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        selectedScenario === key
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-muted-foreground">Budget: ${budget}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                const budget =
                  mode === "custom"
                    ? parseInt(customBudget) || 50
                    : mode === "scenario"
                    ? SCENARIOS[selectedScenario as keyof typeof SCENARIOS]?.budget || 50
                    : 50;
                handleJoin(budget, mode === "scenario" ? selectedScenario : undefined);
              }}
              disabled={
                joinMutation.isPending ||
                !studentName ||
                (mode === "custom" && !customBudget) ||
                (mode === "scenario" && !selectedScenario)
              }
              className="w-full bg-primary hover:bg-primary/90"
            >
              Rejoindre
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
