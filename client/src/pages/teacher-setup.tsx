import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function TeacherSetup() {
  const [_location, navigate] = useLocation();
  const [teacherName, setTeacherName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");

  const createClassMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/classes", {
        teacherName,
        code: classCode,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", data.id] });
      navigate(`/admin/${data.id}`);
    },
    onError: (err: any) => {
      setError("Erreur lors de la création de la classe. Vérifie le code.");
    },
  });

  const handleSubmit = async () => {
    if (!teacherName || !classCode) {
      setError("Tous les champs sont requis");
      return;
    }
    if (classCode.length < 3) {
      setError("Le code doit contenir au moins 3 caractères");
      return;
    }
    setError("");
    createClassMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-primary">Créer une Classe</h1>
          <p className="text-muted-foreground mt-2">
            Configure ta classe et tes élèves
          </p>
        </div>

        {/* Form */}
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="teacher">Ton Nom</Label>
              <Input
                id="teacher"
                placeholder="Ex: Madame Dupont"
                value={teacherName}
                onChange={(e) => {
                  setTeacherName(e.target.value);
                  setError("");
                }}
                data-testid="input-teacher-name"
              />
            </div>

            <div>
              <Label htmlFor="code">Code de Classe</Label>
              <Input
                id="code"
                placeholder="Ex: MATH2024"
                value={classCode}
                onChange={(e) => {
                  setClassCode(e.target.value.toUpperCase());
                  setError("");
                }}
                maxLength="10"
                data-testid="input-new-class-code"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Un code unique pour tes élèves (3-10 caractères)
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={createClassMutation.isPending || !teacherName || !classCode}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
              data-testid="button-create-class"
            >
              {createClassMutation.isPending ? "Création..." : "Créer la Classe"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 mt-8 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Le code sera partagé avec tes élèves pour qu'ils puissent rejoindre ta classe.
          </p>
        </Card>
      </div>
    </div>
  );
}
