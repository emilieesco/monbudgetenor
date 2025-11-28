import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ArrowLeft, Plus, LogIn, Home } from "lucide-react";

export default function TeacherSetup() {
  const [_location, navigate] = useLocation();
  const [mode, setMode] = useState<"choice" | "create" | "connect">("choice");
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
    onError: () => {
      setError("Erreur: le code existe peut-être déjà. Essaie un autre.");
    },
  });

  const connectClassMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/classes/code/${classCode}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", data.id] });
      navigate(`/admin/${data.id}`);
    },
    onError: () => {
      setError("Code de classe introuvable. Vérifie le code.");
    },
  });

  const handleCreate = async () => {
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

  const handleConnect = async () => {
    if (!classCode) {
      setError("Le code est requis");
      return;
    }
    setError("");
    connectClassMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Button
          onClick={() => navigate("/landing")}
          variant="outline"
          className="mb-6 flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Accueil
        </Button>
        <div className="mb-8">
          {mode !== "choice" && (
            <Button
              onClick={() => {
                setMode("choice");
                setError("");
                setTeacherName("");
                setClassCode("");
              }}
              variant="outline"
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          )}
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </Button>
        </div>

        {/* Choice Mode */}
        {mode === "choice" && (
          <>
            <h1 className="text-3xl font-bold text-primary mb-2">Enseignant</h1>
            <p className="text-muted-foreground mb-8">
              Crée une nouvelle classe ou rejoins ta classe existante
            </p>

            <div className="space-y-4">
              <Card
                className="p-6 cursor-pointer hover-elevate transition-all border-2"
                onClick={() => {
                  setMode("create");
                  setError("");
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Créer une Classe</h3>
                    <p className="text-sm text-muted-foreground">
                      Démarre une nouvelle classe avec un code unique
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                className="p-6 cursor-pointer hover-elevate transition-all border-2"
                onClick={() => {
                  setMode("connect");
                  setError("");
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <LogIn className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Rejoindre une Classe</h3>
                    <p className="text-sm text-muted-foreground">
                      Se connecter à ta classe existante avec le code
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Create Mode */}
        {mode === "create" && (
          <>
            <h1 className="text-3xl font-bold text-primary">Créer une Classe</h1>
            <p className="text-muted-foreground mt-2 mb-8">
              Configure ta nouvelle classe
            </p>

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
                  onClick={handleCreate}
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
          </>
        )}

        {/* Connect Mode */}
        {mode === "connect" && (
          <>
            <h1 className="text-3xl font-bold text-primary">Rejoindre une Classe</h1>
            <p className="text-muted-foreground mt-2 mb-8">
              Entre le code de ta classe existante
            </p>

            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="connect-code">Code de Classe</Label>
                  <Input
                    id="connect-code"
                    placeholder="Ex: MATH2024"
                    value={classCode}
                    onChange={(e) => {
                      setClassCode(e.target.value.toUpperCase());
                      setError("");
                    }}
                    data-testid="input-class-code-connect"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Le code de ta classe
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleConnect}
                  disabled={connectClassMutation.isPending || !classCode}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  data-testid="button-connect-class"
                >
                  {connectClassMutation.isPending ? "Connexion..." : "Se Connecter"}
                </Button>
              </div>
            </Card>

            <Card className="p-6 mt-8 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Tu retrouveras tous tes élèves et tu pourras gérer ta classe.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
