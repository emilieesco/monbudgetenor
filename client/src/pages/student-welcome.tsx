import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, TrendingUp, ShoppingCart } from "lucide-react";
import walletImg from "@assets/generated_images/wallet_and_coins_no_background.png";

export default function StudentWelcome() {
  const [_location, navigate] = useLocation();
  const classCode = new URLSearchParams(window.location.search).get("classCode");
  const studentName = new URLSearchParams(window.location.search).get("name");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        {/* Welcome Section with Image */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-5xl font-bold text-primary mb-4">
              Bienvenue, {studentName}! 👋
            </h1>
            <p className="text-xl text-muted-foreground">
              Tu es sur le point de commencer une aventure budgétaire passionnante!
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src={walletImg}
              alt="Portefeuille et pièces"
              className="w-full max-w-sm drop-shadow-lg"
            />
          </div>
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
        <Card className="p-8 mb-12 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-lg mb-4">Conseils pour réussir 💡</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span>✓</span>
              <span>Planifie tes achats avant de commencer</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Paie d'abord tes dépenses obligatoires</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Garde de l'argent pour les surprises</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Distingue essentiels et désirs</span>
            </li>
          </ul>
        </Card>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(`/student/setup?classCode=${classCode}`)}
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
