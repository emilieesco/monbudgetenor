import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function StudentJoin() {
  const [_location, navigate] = useLocation();
  const [studentName, setStudentName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/students/join", {
        name: studentName,
        classCode: classCode,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      navigate(`/student/${data.id}`);
    },
    onError: (err: any) => {
      setError("Code de classe invalide. Vérifie et réessaie.");
    },
  });

  const handleSubmit = async () => {
    if (!studentName || !classCode) {
      setError("Tous les champs sont requis");
      return;
    }
    setError("");
    // Redirect to welcome page
    navigate(`/student/welcome?classCode=${classCode.toUpperCase()}&name=${encodeURIComponent(studentName)}`);
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
          <h1 className="text-3xl font-bold text-primary">Rejoindre une Classe</h1>
          <p className="text-muted-foreground mt-2">
            Entre ton prénom et le code de ta classe
          </p>
        </div>

        {/* Form */}
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Ton Prénom</Label>
              <Input
                id="name"
                placeholder="Ex: Jean"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setError("");
                }}
                data-testid="input-student-name"
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
                data-testid="input-class-code"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Demande le code à ton enseignant
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={joinMutation.isPending || !studentName || !classCode}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
              data-testid="button-join-class"
            >
              {joinMutation.isPending ? "Connexion..." : "Rejoindre"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
