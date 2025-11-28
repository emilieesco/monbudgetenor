import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, TrendingUp, ShoppingCart, CheckCircle2, AlertCircle, Eye, Target, PieChart, DollarSign } from "lucide-react";

export default function StudentWelcome() {
  const [_location, navigate] = useLocation();
  const classCode = new URLSearchParams(window.location.search).get("classCode");
  const studentName = new URLSearchParams(window.location.search).get("name");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4">
            Bienvenue, {studentName}! 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            Tu es sur le point de commencer une aventure budgétaire passionnante!
          </p>
        </div>

        {/* Game Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Wallet className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Gère ton Budget</h3>
                <p className="text-sm text-muted-foreground">
                  Tu auras 50$ par mois pour gérer tes dépenses et faire des choix intelligents.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Apprends à Économiser</h3>
                <p className="text-sm text-muted-foreground">
                  Découvre quelles dépenses sont essentielles et lesquelles peux être évitées.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <ShoppingCart className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Shopping Responsable</h3>
                <p className="text-sm text-muted-foreground">
                  Remplis tes paniers avec des vraies dépenses et des catalogues réalistes.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Comment ça marche?</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold">Choisis ton mode budgétaire</p>
                <p className="text-sm text-muted-foreground">
                  Budget prédéfini, personnalisé ou profil réaliste
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold">Paie tes dépenses fixes</p>
                <p className="text-sm text-muted-foreground">
                  Loyer, électricité, Internet... ce qu'on doit payer!
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold">Fais du shopping</p>
                <p className="text-sm text-muted-foreground">
                  Avec le reste, achète nourriture, vêtements ou loisirs
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-semibold">Gagne des points</p>
                <p className="text-sm text-muted-foreground">
                  Les bonnes décisions te font des bravo, les mauvaises des avertissements
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tips Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Conseils pour réussir</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Essential Expenses */}
            <Card className="p-6 border-l-4 border-l-destructive">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Dépenses Obligatoires d'Abord</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Les dépenses fixes (loyer, électricité, nourriture) doivent être payées en priorité. Sans celles-ci, tu ne peux pas survivre!
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Paie le loyer</li>
                    <li>• Puis les services (électricité, Internet)</li>
                    <li>• Puis la nourriture de base</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Planning Ahead */}
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-start gap-4">
                <Target className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Planifie Tes Achats</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Avant de cliquer, fais une liste mentale de ce dont tu as besoin. Cela évite les achats impulsifs!
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Liste tes besoins vs tes envies</li>
                    <li>• Estime le coût total</li>
                    <li>• Vérifie que tu as assez d'argent</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Budget Reserve */}
            <Card className="p-6 border-l-4 border-l-yellow-500">
              <div className="flex items-start gap-4">
                <DollarSign className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Garde une Réserve</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ne dépense pas tout d'un coup! Les dépenses surprises peuvent arriver à tout moment.
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Essaie de garder 10-20% de ton budget</li>
                    <li>• Sois prêt pour les urgences</li>
                    <li>• C'est la sagesse du vrai monde</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Distinguish Needs vs Wants */}
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-start gap-4">
                <Eye className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Besoins vs Envies</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Essentiels = nourriture, vêtements, logement. Envies = sorties, jeux, extras.
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Essentiels: tu dois les payer</li>
                    <li>• Envies: achète si tu en as les moyens</li>
                    <li>• La vraie richesse, c'est le choix!</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Track Spending */}
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-start gap-4">
                <PieChart className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Suis tes Dépenses</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Le jeu te montre où va ton argent. Regarde les catégories qui te coûtent le plus.
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Où dépenses-tu le plus?</li>
                    <li>• Peux-tu réduire certaines dépenses?</li>
                    <li>• C'est comme ça qu'on apprend!</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Make Smart Choices */}
            <Card className="p-6 border-l-4 border-l-purple-500">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Fais des Choix Intelligents</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Chaque achat te rapporte des points ou des avertissements. Les choix responsables payent!
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Achète des produits essentiels</li>
                    <li>• Évite les dépenses inutiles</li>
                    <li>• Regarde tes retours pour apprendre</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Pro Tips */}
          <Card className="p-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-2 border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-lg mb-4">Astuces Pro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">😊 Sois Responsable</p>
                <p className="text-muted-foreground">Les bonnes décisions financières te rendront heureux et ton score augmentera!</p>
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">🎯 Fixe-toi des Objectifs</p>
                <p className="text-muted-foreground">Essaie de terminer le mois sans dépasser ton budget. C'est un défi!</p>
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">📚 Apprends de Tes Erreurs</p>
                <p className="text-muted-foreground">Si tu dépenses trop, l'app te le dit. C'est une leçon gratuite!</p>
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">💪 Sois Persévérant</p>
                <p className="text-muted-foreground">Chaque mois est une nouvelle chance de t'améliorer. Vas-y!</p>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(`/student/setup?classCode=${classCode}&name=${encodeURIComponent(studentName || "")}`)}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            data-testid="button-start-game"
          >
            Commencer l'Aventure! 🚀
          </Button>
        </div>
      </div>
    </div>
  );
}
