import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, ShoppingCart, Users } from "lucide-react";
import walletImg from "@assets/poo_1764362219794.png";

export default function Landing() {
  const [_location, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-6xl md:text-7xl font-bold text-primary mb-6">
                Mon Budget en Or
              </h1>
              <p className="text-2xl md:text-3xl text-muted-foreground mb-8">
                Apprenez à gérer votre argent avec sagesse
              </p>
              <p className="text-lg text-muted-foreground mb-12">
                Un jeu éducatif immersif où vous gérez des budgets réalistes, payez des dépenses et faites des choix intelligents
              </p>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
                size="lg"
                data-testid="button-get-started"
              >
                Commencer Maintenant 🚀
              </Button>
            </div>
            <div className="flex justify-center">
              <img
                src={walletImg}
                alt="Portefeuille et pièces"
                className="w-full max-w-md drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Pourquoi Mon Budget en Or?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <Wallet className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Gestion Budgétaire</h3>
            <p className="text-muted-foreground text-center">
              Apprenez à gérer un budget réaliste avec des dépenses fixes, variables et des choix intelligents
            </p>
          </Card>

          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Apprentissage Progressif</h3>
            <p className="text-muted-foreground text-center">
              Trois modes d'apprentissage: Budget prédéfini, personnalisé ou basé sur des scénarios réalistes
            </p>
          </Card>

          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center mb-4">Expérience Réaliste</h3>
            <p className="text-muted-foreground text-center">
              Catalogues de produits réalistes, dépenses surprises et retours immédiats sur vos décisions
            </p>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Comment ça marche?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <h3 className="font-bold mb-2">Rejoin une classe</h3>
              <p className="text-sm text-muted-foreground">
                Entre ton prénom et le code donné par ton prof
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <h3 className="font-bold mb-2">Choisis ton profil</h3>
              <p className="text-sm text-muted-foreground">
                Budget prédéfini, personnalisé ou scénario réaliste
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <h3 className="font-bold mb-2">Paie tes dépenses</h3>
              <p className="text-sm text-muted-foreground">
                Dépenses fixes obligatoires puis choisis tes achats
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  4
                </div>
              </div>
              <h3 className="font-bold mb-2">Apprends et gagne!</h3>
              <p className="text-sm text-muted-foreground">
                Reçois des retours et améliore tes choix
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For Teachers Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Pour les Enseignants</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Créez des classes, gérez les budgets de vos élèves et suivez leur progression en temps réel.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Créer des classes avec codes uniques</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Configurer les montants de dépenses</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Ajouter des dépenses surprises</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Suivre les performances des élèves</span>
              </li>
            </ul>
          </div>
          <Card className="p-8 bg-primary/5">
            <Users className="w-16 h-16 text-primary mb-4" />
            <p className="text-muted-foreground mb-6">
              Les enseignants obtiennent des outils puissants pour créer une expérience d'apprentissage engageante et adaptive.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              className="w-full"
            >
              Accès Enseignant
            </Button>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à commencer?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Que tu sois élève ou enseignant, rejoins-nous et commence ton aventure budgétaire!
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            size="lg"
          >
            Accéder à l'Application 🎯
          </Button>
        </div>
      </div>
    </div>
  );
}
