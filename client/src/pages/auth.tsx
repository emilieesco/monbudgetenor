import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";

export default function Auth() {
  const [_location, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate("/")}
            className="mb-6 inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition"
          >
            ←
          </button>
          <h1 className="text-5xl font-bold text-primary mb-4">Mon Budget en Or</h1>
          <p className="text-xl text-muted-foreground">Choisissez votre rôle</p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Card */}
          <Card
            className="p-8 hover-elevate cursor-pointer transition-all"
            onClick={() => navigate("/student-join")}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Users className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Je suis Élève</h2>
            <p className="text-muted-foreground text-center mb-6">
              Rejoins ta classe avec ton prénom et le code fourni par ton enseignant
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
              Commencer
            </Button>
          </Card>

          {/* Teacher Card */}
          <Card
            className="p-8 hover-elevate cursor-pointer transition-all"
            onClick={() => navigate("/teacher-setup")}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Je suis Enseignant</h2>
            <p className="text-muted-foreground text-center mb-6">
              Crée une classe et gère les budgets de tes élèves
            </p>
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
              Accéder
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
