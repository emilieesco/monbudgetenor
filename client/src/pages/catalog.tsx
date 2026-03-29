import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { ShoppingCart, AlertCircle, CheckCircle2, ArrowLeft, Plus, Minus, Trash2, Receipt, Leaf, Star, Tag, ThumbsUp, AlertTriangle, TrendingUp, Lightbulb, Heart } from "lucide-react";
import type { CatalogItem, Student } from "@shared/schema";

import imgLait from "@assets/catalog/lait.png";
import imgFromage from "@assets/catalog/fromage.png";
import imgYogourt from "@assets/catalog/yogourt.png";
import imgBeurre from "@assets/catalog/beurre.png";
import imgPoulet from "@assets/catalog/poulet.png";
import imgBoeuf from "@assets/catalog/boeuf.png";
import imgBananes from "@assets/catalog/bananes.png";
import imgPommes from "@assets/catalog/pommes.png";
import imgPain from "@assets/catalog/pain.png";
import imgJusOrange from "@assets/catalog/jus-orange.png";
import imgCarottes from "@assets/catalog/carottes.png";
import imgBrocoli from "@assets/catalog/brocoli.png";
import imgTomates from "@assets/catalog/tomates.png";
import imgPommesDeterre from "@assets/catalog/pommes-de-terre.png";
import imgChocolat from "@assets/catalog/chocolat.png";
import imgChips from "@assets/catalog/chips.png";
import imgTshirt from "@assets/catalog/tshirt.png";
import imgJeans from "@assets/catalog/jeans.png";
import imgEspadrilles from "@assets/catalog/espadrilles.png";
import imgCinema from "@assets/catalog/cinema.png";
import imgOeufs from "@assets/catalog/oeufs.png";
import imgBacon from "@assets/catalog/bacon.png";
import imgSaumon from "@assets/catalog/saumon.png";
import imgCrevettes from "@assets/catalog/crevettes.png";
import imgPates from "@assets/catalog/pates.png";
import imgRiz from "@assets/catalog/riz.png";
import imgBeurreArachide from "@assets/catalog/beurre-arachide.png";
import imgThon from "@assets/catalog/thon.png";
import imgSauceTomate from "@assets/catalog/sauce-tomate.png";
import imgGruau from "@assets/catalog/gruau.png";
import imgOranges from "@assets/catalog/oranges.png";
import imgFraises from "@assets/catalog/fraises.png";
import imgLaitue from "@assets/catalog/laitue.png";
import imgOignons from "@assets/catalog/oignons.png";
import imgPoivrons from "@assets/catalog/poivrons.png";
import imgMangues from "@assets/catalog/mangues.png";
import imgBagels from "@assets/catalog/bagels.png";
import imgCroissants from "@assets/catalog/croissants.png";
import imgCremeGlacee from "@assets/catalog/creme-glacee.png";
import imgCafe from "@assets/catalog/cafe.png";

const QUEBEC_TAX_RATE = 0.14975;

const CATEGORIES = [
  { id: "food", name: "Épicerie", icon: "🛒", color: "bg-red-700", accent: "bg-red-600" },
  { id: "clothing", name: "Vêtements", icon: "👕", color: "bg-blue-700", accent: "bg-blue-600" },
  { id: "leisure", name: "Loisirs", icon: "🎮", color: "bg-purple-700", accent: "bg-purple-600" },
  { id: "sale", name: "Soldes", icon: "🏷️", color: "bg-yellow-600", accent: "bg-yellow-500" },
];

const FOOD_SUBCATEGORIES = [
  { id: "Produits Laitiers", icon: "🥛" },
  { id: "Viandes", icon: "🍗" },
  { id: "Fruits & Légumes", icon: "🥬" },
  { id: "Conserves", icon: "🥫" },
  { id: "Boulangerie", icon: "🍞" },
  { id: "Bonbons & Sucreries", icon: "🍬" },
  { id: "Boissons", icon: "🥤" },
  { id: "Hygiène", icon: "🧴" },
  { id: "Pharmacie", icon: "💊" },
];

const LEISURE_SUBCATEGORIES = [
  { id: "Restauration", icon: "🍽️" },
  { id: "Sports & Plein air", icon: "⚽" },
  { id: "Culture & Sorties", icon: "🎬" },
  { id: "Abonnements numériques", icon: "📺" },
];

const ITEMS_PER_PAGE = 18;

interface CatalogItemWithPromo extends CatalogItem {
  originalPrice?: number;
  discountPct?: number;
}

interface CartItem {
  item: CatalogItemWithPromo;
  quantity: number;
}

function getProductEmoji(name: string, category: string): string {
  const n = name.toLowerCase();

  if (category === "food") {
    // === Cas spéciaux (ordre important!) ===
    if (n.includes("beurre d'arachide")) return "🥜";
    if (n.includes("pain à l'ail")) return "🥖";
    if (n.includes("eau de coco")) return "🥥";
    if (n.includes("lait de soya")) return "🥛";
    if (n.includes("sauce bbq")) return "🍖";
    if (n.includes("sauce soya")) return "🫙";
    if (n.includes("bouillon")) return "🍲";
    if (n.includes("fèves au lard")) return "🫘";

    // === Produits Laitiers ===
    if (n.includes("lait au chocolat")) return "🍫";
    if (n.includes("lait")) return "🥛";
    if (n.includes("yogourt aux fruits")) return "🍓";
    if (n.includes("yogourt") || n.includes("yaourt")) return "🥣";
    if (n.includes("kéfir")) return "🥛";
    if (n.includes("ricotta")) return "🧀";
    if (n.includes("brie")) return "🧀";
    if (n.includes("parmesan")) return "🧀";
    if (n.includes("mozzarella")) return "🧀";
    if (n.includes("cheddar")) return "🧀";
    if (n.includes("cottage")) return "🧀";
    if (n.includes("fromage en grains")) return "🧀";
    if (n.includes("fromage")) return "🧀";
    if (n.includes("beurre")) return "🧈";
    if (n.includes("crème sure")) return "🥛";
    if (n.includes("crème 35") || n.includes("crème glacée")) return "🍦";
    if (n.includes("crème")) return "🥛";

    // === Viandes & Protéines ===
    // IMPORTANT: vérifier "bœuf"/"boeuf" AVANT "œuf" pour éviter que "steak de bœuf" match "œuf"
    if (n.includes("bœuf") || n.includes("boeuf") || n.includes("steak")) return "🥩";
    if (n.includes("veau")) return "🥩";
    if (n.includes("œuf") || n.includes("oeuf")) return "🥚";
    if (n.includes("bacon")) return "🥓";
    if (n.includes("saumon")) return "🐟";
    if (n.includes("tilapia")) return "🐟";
    if (n.includes("pétoncle")) return "🦪";
    if (n.includes("moule")) return "🦪";
    if (n.includes("crevette")) return "🦐";
    if (n.includes("dinde")) return "🦃";
    if (n.includes("saucisse") || n.includes("saucisson")) return "🌭";
    if (n.includes("jambon")) return "🥩";
    if (n.includes("pepperoni")) return "🍕";
    if (n.includes("tofu")) return "🫘";
    if (n.includes("poulet rôti")) return "🍗";
    if (n.includes("poulet")) return "🍗";
    if (n.includes("porc") || n.includes("côtelette")) return "🐷";
    if (n.includes("poitrines")) return "🍗";

    // === Fruits & Légumes ===
    if (n.includes("ananas")) return "🍍";
    if (n.includes("kiwi")) return "🥝";
    if (n.includes("framboise")) return "🍓";
    if (n.includes("banane")) return "🍌";
    if (n.includes("pomme de terre") || n.includes("patate douce")) return "🥔";
    if (n.includes("patate")) return "🥔";
    if (n.includes("pomme")) return "🍎";
    if (n.includes("orange")) return "🍊";
    if (n.includes("fraise")) return "🍓";
    if (n.includes("bleuet")) return "🫐";
    if (n.includes("raisin")) return "🍇";
    if (n.includes("mangue")) return "🥭";
    if (n.includes("pêche")) return "🍑";
    if (n.includes("avocat")) return "🥑";
    if (n.includes("citron")) return "🍋";
    if (n.includes("asperge")) return "🌿";
    if (n.includes("betterave")) return "🫐";
    if (n.includes("tomate")) return "🍅";
    if (n.includes("carotte")) return "🥕";
    if (n.includes("brocoli")) return "🥦";
    if (n.includes("chou-fleur")) return "🥦";
    if (n.includes("laitue") || n.includes("romaine") || n.includes("épinard")) return "🥬";
    if (n.includes("concombre") || n.includes("courgette")) return "🥒";
    if (n.includes("poivron")) return "🫑";
    if (n.includes("champignon")) return "🍄";
    if (n.includes("maïs en épi")) return "🌽";
    if (n.includes("pois vert") || n.includes("pois surgelé")) return "🫛";
    if (n.includes("ail")) return "🧄";
    if (n.includes("oignon")) return "🧅";
    if (n.includes("céleri")) return "🌿";

    // === Conserves & Épicerie ===
    if (n.includes("spaghetti") || n.includes("macaroni") || n.includes("pâtes")) return "🍝";
    if (n.includes("riz")) return "🍚";
    if (n.includes("soupe")) return "🍜";
    if (n.includes("thon")) return "🐟";
    if (n.includes("maïs")) return "🌽";
    if (n.includes("haricot") || n.includes("pois chiche") || n.includes("lentille")) return "🫘";
    if (n.includes("sirop d'érable")) return "🍁";
    if (n.includes("miel")) return "🍯";
    if (n.includes("confiture")) return "🍯";
    if (n.includes("arachide") || n.includes("beurre d'ara")) return "🥜";
    if (n.includes("céréale") || n.includes("cheerio") || n.includes("flocon")) return "🥣";
    if (n.includes("huile")) return "🫙";
    if (n.includes("ketchup") || n.includes("sauce tomate")) return "🍅";
    if (n.includes("moutarde") || n.includes("mayonnaise")) return "🫙";

    // === Boulangerie ===
    if (n.includes("bagel")) return "🥯";
    if (n.includes("croissant")) return "🥐";
    if (n.includes("brioche")) return "🥐";
    if (n.includes("crêpe")) return "🥞";
    if (n.includes("pita")) return "🫓";
    if (n.includes("tortilla")) return "🌮";
    if (n.includes("baguette") || n.includes("pain à l'ail")) return "🥖";
    if (n.includes("hot-dog") || n.includes("hamburger")) return "🍔";
    if (n.includes("naan")) return "🫓";
    if (n.includes("muffin anglais")) return "🥐";
    if (n.includes("pain")) return "🍞";

    // === Bonbons & Sucreries ===
    if (n.includes("crème glacée")) return "🍦";
    if (n.includes("gâteau")) return "🎂";
    if (n.includes("macaron")) return "🍪";
    if (n.includes("brownie")) return "🍫";
    if (n.includes("popcorn")) return "🍿";
    if (n.includes("chips ahoy") || n.includes("oreo")) return "🍪";
    if (n.includes("biscuit")) return "🍪";
    if (n.includes("craquelins") || n.includes("ritz")) return "🧂";
    if (n.includes("granola")) return "🌾";
    if (n.includes("twix") || n.includes("reese") || n.includes("cadbury") || n.includes("mini-egg")) return "🍫";
    if (n.includes("lindt") || n.includes("kit kat") || n.includes("oh henry") ||
        n.includes("aero") || n.includes("caramilk") || n.includes("coffee crisp")) return "🍫";
    if (n.includes("chocolat")) return "🍫";
    if (n.includes("bonbon") || n.includes("gélifié") || n.includes("réglisse") ||
        n.includes("skittles") || n.includes("smartie")) return "🍬";
    if (n.includes("m&m")) return "🍬";
    if (n.includes("doritos")) return "🌮";
    if (n.includes("cheetos")) return "🧀";
    if (n.includes("pringles")) return "🫙";
    if (n.includes("lays") || n.includes("ruffles")) return "🥔";
    if (n.includes("chips")) return "🥔";

    // === Boissons ===
    if (n.includes("gruau")) return "🥣";
    if (n.includes("kombucha")) return "🍶";
    if (n.includes("celsius")) return "🥤";
    if (n.includes("kool-aid") || n.includes("punch")) return "🧃";
    if (n.includes("eau")) return "💧";
    if (n.includes("café") || n.includes("chocolat chaud")) return "☕";
    if (n.includes("thé glacé") || n.includes("nestea")) return "🧋";
    if (n.includes("thé")) return "🍵";
    if (n.includes("jus")) return "🧃";
    if (n.includes("gatorade")) return "🧴";
    if (n.includes("limonade")) return "🍋";
    if (n.includes("pepsi") || n.includes("coca") || n.includes("sprite") ||
        n.includes("7-up") || n.includes("red bull") || n.includes("monster") ||
        n.includes("soda") || n.includes("v8")) return "🥤";

    // === Hygiène ===
    if (n.includes("shampoing") || n.includes("shampooing")) return "🧴";
    if (n.includes("après-shampoing") || n.includes("apres-shampoing") || n.includes("conditionneur")) return "🧴";
    if (n.includes("savon à main") || n.includes("savon corporel") || n.includes("gel douche")) return "🧼";
    if (n.includes("savon")) return "🧼";
    if (n.includes("dentifrice") || n.includes("pâte dentifrice")) return "🪥";
    if (n.includes("brosse à dents") || n.includes("brosse a dents")) return "🪥";
    if (n.includes("déodorant") || n.includes("deodorant") || n.includes("anti-transpirant")) return "🧴";
    if (n.includes("papier hygiénique") || n.includes("papier hygienique") || n.includes("mouchoir")) return "🧻";
    if (n.includes("rasoir")) return "🪒";
    if (n.includes("serviette hygiénique") || n.includes("tampon") || n.includes("pad ")) return "🩹";
    if (n.includes("coton-tige") || n.includes("q-tip")) return "🩹";
    if (n.includes("crème à raser") || n.includes("mousse à raser")) return "🧴";

    // === Pharmacie ===
    if (n.includes("tylenol") || n.includes("advil") || n.includes("ibuprofène") || n.includes("aspirine") || n.includes("capsule") || n.includes("comprimé")) return "💊";
    if (n.includes("vitamine") || n.includes("supplément")) return "💊";
    if (n.includes("bain de bouche")) return "🫧";
    if (n.includes("crème hydratante") || n.includes("lotion")) return "🧴";
    if (n.includes("bandage") || n.includes("pansement")) return "🩹";
    if (n.includes("thermomètre")) return "🌡️";
    if (n.includes("médicament")) return "💊";

    return "🛒";
  }

  if (category === "clothing") {
    if (n.includes("t-shirt")) return "👕";
    if (n.includes("pantalon de jogging") || n.includes("jogging")) return "🩳";
    if (n.includes("jeans") || n.includes("pantalon")) return "👖";
    if (n.includes("chaussette")) return "🧦";
    if (n.includes("espadrille")) return "👟";
    if (n.includes("chaussure") || n.includes("sandales")) return "👟";
    if (n.includes("bottes")) return "👢";
    if (n.includes("casquette")) return "🧢";
    if (n.includes("tuque")) return "🎩";
    if (n.includes("gants")) return "🧤";
    if (n.includes("écharpe")) return "🧣";
    if (n.includes("maillot de bain")) return "🩱";
    if (n.includes("maillot")) return "🏊";
    if (n.includes("robe")) return "👗";
    if (n.includes("bermuda")) return "🩳";
    if (n.includes("pyjama")) return "🌙";
    if (n.includes("sous-vêtement") || n.includes("sous-vetement")) return "🩲";
    if (n.includes("capuche") || n.includes("chandail")) return "🧥";
    if (n.includes("manteau") || n.includes("veste") || n.includes("pull")) return "🧥";
    return "👕";
  }

  if (category === "leisure") {
    // Restauration
    if (n.includes("tim hortons")) return "☕";
    if (n.includes("mcdonald") || n.includes("mcflurry") || n.includes("big mac")) return "🍔";
    if (n.includes("poutine")) return "🍟";
    if (n.includes("subway")) return "🥖";
    if (n.includes("sushi")) return "🍱";
    if (n.includes("bubble tea") || n.includes("boba")) return "🧋";
    if (n.includes("pizza poche") || n.includes("pizza")) return "🍕";
    if (n.includes("restaurant") || n.includes("repas")) return "🍽️";
    if (n.includes("hamburger") || n.includes("burger")) return "🍔";
    if (n.includes("hot-dog") || n.includes("hot dog")) return "🌭";
    if (n.includes("taco") || n.includes("burrito")) return "🌮";
    // Abonnements & tech
    if (n.includes("disney+") || n.includes("disney plus") || n.includes("disney+")) return "🎬";
    if (n.includes("netflix")) return "📺";
    if (n.includes("spotify")) return "🎧";
    if (n.includes("youtube") || n.includes("abonnement")) return "📺";
    // Sports & activités
    if (n.includes("ski")) return "⛷️";
    if (n.includes("karting")) return "🏎️";
    if (n.includes("yoga") || n.includes("pilates")) return "🧘";
    if (n.includes("natation") || n.includes("piscine")) return "🏊";
    if (n.includes("gym") || n.includes("fitness") || n.includes("musculation")) return "🏋️";
    if (n.includes("bowling")) return "🎳";
    if (n.includes("escape")) return "🔐";
    if (n.includes("ballon") || n.includes("soccer")) return "⚽";
    if (n.includes("raquette") || n.includes("tennis")) return "🎾";
    if (n.includes("casque vélo") || n.includes("vélo") || n.includes("velo")) return "🚲";
    if (n.includes("ski alpin") || n.includes("patinage")) return "⛷️";
    if (n.includes("salle de sport") || n.includes("cours de sport")) return "🏋️";
    // Culture & divertissement
    if (n.includes("guitare")) return "🎸";
    if (n.includes("parc d'attractions") || n.includes("parc d")) return "🎡";
    if (n.includes("musée")) return "🏛️";
    if (n.includes("zoo")) return "🦒";
    if (n.includes("cinéma") || n.includes("cinema")) return "🎬";
    if (n.includes("concert") || n.includes("ticket") || n.includes("spectacle")) return "🎵";
    if (n.includes("karaoké") || n.includes("karaoke")) return "🎤";
    if (n.includes("jeu vidéo") || n.includes("jeu video")) return "🎮";
    if (n.includes("livre")) return "📚";
    if (n.includes("cours")) return "📖";
    // Soins & beauté
    if (n.includes("café") || n.includes("starbucks")) return "☕";
    if (n.includes("manucure")) return "💅";
    if (n.includes("coupe")) return "✂️";
    if (n.includes("tatouage")) return "🎨";
    if (n.includes("piercing")) return "💎";
    // Transport
    if (n.includes("uber") || n.includes("taxi")) return "🚗";
    if (n.includes("autobus") || n.includes("billet") || n.includes("opus")) return "🚌";
    return "🎮";
  }

  return "🛒";
}

function getProductImage(name: string, category: string): string | null {
  const n = name.toLowerCase();

  if (category === "food") {
    // Produits laitiers
    if (n.includes("lait") && !n.includes("chocolat") && !n.includes("amande") && !n.includes("soya") && !n.includes("coco")) return imgLait;
    if (n.includes("fromage") || n.includes("cheddar") || n.includes("mozzarella") || n.includes("ricotta") || n.includes("brie") || n.includes("parmesan") || n.includes("cottage")) return imgFromage;
    if (n.includes("yogourt") || n.includes("yaourt") || n.includes("kéfir")) return imgYogourt;
    if (n.includes("beurre") && !n.includes("arachide")) return imgBeurre;
    // Viandes & protéines
    if (n.includes("oeuf") || n.includes("œuf")) return imgOeufs;
    if (n.includes("bacon")) return imgBacon;
    if (n.includes("saumon")) return imgSaumon;
    if (n.includes("crevette")) return imgCrevettes;
    if (n.includes("thon")) return imgThon;
    if (n.includes("poulet") || n.includes("dinde") || n.includes("poitrines")) return imgPoulet;
    if (n.includes("bœuf") || n.includes("boeuf") || n.includes("steak") || n.includes("veau") || n.includes("jambon") || n.includes("porc") || n.includes("côtelette") || n.includes("cotelette")) return imgBoeuf;
    // Fruits
    if (n.includes("banane")) return imgBananes;
    if (n.includes("fraise")) return imgFraises;
    if (n.includes("orange")) return imgOranges;
    if (n.includes("mangue")) return imgMangues;
    if (n.includes("pomme") && !n.includes("de terre") && !n.includes("patate") && !n.includes("jus") && !n.includes("arachide")) return imgPommes;
    // Légumes
    if (n.includes("pomme de terre") || n.includes("patate") || n.includes("russet")) return imgPommesDeterre;
    if (n.includes("carotte")) return imgCarottes;
    if (n.includes("brocoli") || n.includes("chou-fleur")) return imgBrocoli;
    if (n.includes("tomate") && !n.includes("sauce")) return imgTomates;
    if (n.includes("laitue") || n.includes("romaine") || n.includes("épinard") || n.includes("epinard")) return imgLaitue;
    if (n.includes("oignon")) return imgOignons;
    if (n.includes("poivron")) return imgPoivrons;
    // Conserves & épicerie sèche
    if (n.includes("sauce tomate") || n.includes("sauce pasta") || n.includes("classico")) return imgSauceTomate;
    if (n.includes("pâte") || n.includes("pate") || n.includes("spaghetti") || n.includes("macaroni") || n.includes("fusilli")) return imgPates;
    if (n.includes("riz") && !n.includes("lait")) return imgRiz;
    if (n.includes("beurre d'arachide") || n.includes("beurre arachide")) return imgBeurreArachide;
    if (n.includes("gruau") || n.includes("avoine") || n.includes("oatmeal")) return imgGruau;
    // Boulangerie
    if (n.includes("bagel")) return imgBagels;
    if (n.includes("croissant")) return imgCroissants;
    if (n.includes("pain") && !n.includes("pizza")) return imgPain;
    // Boissons
    if (n.includes("café") || n.includes("cafe") || n.includes("maxwell") || n.includes("folgers")) return imgCafe;
    if (n.includes("jus")) return imgJusOrange;
    // Sucreries & collations
    if (n.includes("crème glacée") || n.includes("creme glacee") || n.includes("gelato") || n.includes("sorbet")) return imgCremeGlacee;
    if (n.includes("chocolat") || n.includes("twix") || n.includes("reese") || n.includes("cadbury") || n.includes("kit kat") || n.includes("oh henry") || n.includes("aero") || n.includes("caramilk") || n.includes("coffee crisp") || n.includes("lindt")) return imgChocolat;
    if (n.includes("chips") || n.includes("lays") || n.includes("ruffles") || n.includes("doritos") || n.includes("pringles") || n.includes("cheetos")) return imgChips;
  }

  if (category === "clothing") {
    if (n.includes("t-shirt") || n.includes("chandail") || n.includes("pull") || n.includes("capuche")) return imgTshirt;
    if (n.includes("jeans") || n.includes("pantalon") || n.includes("jogging") || n.includes("bermuda")) return imgJeans;
    if (n.includes("espadrille") || n.includes("chaussure") || n.includes("sandales") || n.includes("bottes")) return imgEspadrilles;
  }

  if (category === "leisure") {
    if (n.includes("cinéma") || n.includes("cinema") || n.includes("film")) return imgCinema;
  }

  return null;
}

type PromoEntry = { name: string; discountPct: number };

const PROMO_SETS: PromoEntry[][] = [
  [
    { name: "Poulet entier 1.5kg", discountPct: 25 },
    { name: "Bœuf haché mi-maigre 450g", discountPct: 25 },
    { name: "Beurre salé 454g", discountPct: 20 },
    { name: "Pommes Gala 3lb", discountPct: 30 },
    { name: "Oranges Navel 4lb", discountPct: 25 },
    { name: "Carottes 2lb", discountPct: 20 },
    { name: "Mozzarella 340g", discountPct: 20 },
    { name: "Yogourt nature 650g", discountPct: 25 },
    { name: "T-shirt", discountPct: 35 },
    { name: "Jeans bleu", discountPct: 30 },
    { name: "Chaussettes", discountPct: 40 },
    { name: "Cinéma", discountPct: 20 },
    { name: "Zoo de Granby (entrée)", discountPct: 20 },
    { name: "Abonnement Netflix", discountPct: 20 },
    { name: "Bowling", discountPct: 30 },
  ],
  [
    { name: "Poitrines de poulet 900g", discountPct: 25 },
    { name: "Saumon filet 400g", discountPct: 30 },
    { name: "Fromage cheddar 400g", discountPct: 25 },
    { name: "Pommes de terre 10lb", discountPct: 35 },
    { name: "Lait 2% 2L", discountPct: 20 },
    { name: "Tomates grappe", discountPct: 25 },
    { name: "Crème sure 500ml", discountPct: 30 },
    { name: "Œufs gros calibre 12", discountPct: 25 },
    { name: "Veste d'hiver", discountPct: 30 },
    { name: "Bottes d'hiver", discountPct: 25 },
    { name: "Casquette", discountPct: 35 },
    { name: "Entrée piscine", discountPct: 25 },
    { name: "Musée des beaux-arts", discountPct: 35 },
    { name: "Abonnement Spotify", discountPct: 25 },
    { name: "Parc d'attractions", discountPct: 20 },
  ],
  [
    { name: "Bacon 375g", discountPct: 30 },
    { name: "Crème 35% 473ml", discountPct: 30 },
    { name: "Côtelettes de porc 600g", discountPct: 25 },
    { name: "Crevettes 340g", discountPct: 30 },
    { name: "Brocoli", discountPct: 25 },
    { name: "Laitue romaine", discountPct: 25 },
    { name: "Bananes", discountPct: 20 },
    { name: "Lait 3.25% 2L", discountPct: 20 },
    { name: "Pull", discountPct: 30 },
    { name: "Bermuda", discountPct: 35 },
    { name: "Robe d'été", discountPct: 30 },
    { name: "Cours de guitare (cours)", discountPct: 25 },
    { name: "Ski de fond (journée)", discountPct: 30 },
    { name: "Karaoké", discountPct: 30 },
    { name: "Abonnement YouTube Premium", discountPct: 25 },
  ],
];

function getPromoSetIndex(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(dayOfYear / 14) % PROMO_SETS.length;
}

function getPromoValidDates(): { start: Date; end: Date } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const period = Math.floor(dayOfYear / 14);
  const start = new Date(startOfYear);
  start.setDate(1 + period * 14);
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  return { start, end };
}

function applyPromos(items: CatalogItem[]): CatalogItemWithPromo[] {
  const currentPromos = PROMO_SETS[getPromoSetIndex()];
  return items.map(item => {
    const promo = currentPromos.find(p => p.name.toLowerCase() === item.name.toLowerCase());
    if (!promo) return item;
    const originalPrice = item.price;
    const discountedPrice = Math.round(originalPrice * (1 - promo.discountPct / 100) * 100) / 100;
    return { ...item, price: discountedPrice, originalPrice, discountPct: promo.discountPct };
  });
}

function getWeekDates() {
  const now = new Date();
  const start = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
  return `${fmt(start)} au ${fmt(end)}`;
}

function getItemExplanation(item: CatalogItem): string {
  const n = item.name.toLowerCase();
  if (item.category === "food") {
    if (n.includes("chips") || n.includes("doritos") || n.includes("cheetos") || n.includes("pringles") || n.includes("ruffles") || n.includes("lays")) {
      return "Collation salée — occasionnellement c'est correct, mais ça s'accumule!";
    }
    if (n.includes("chocolat") || n.includes("bonbon") || n.includes("crème glacée") || n.includes("gâteau") || n.includes("twix") || n.includes("reese") || n.includes("macaron") || n.includes("cookie")) {
      return "Sucrerie — à savourer avec modération. Ça peut attendre.";
    }
    if (n.includes("pepsi") || n.includes("coca") || n.includes("sprite") || n.includes("red bull") || n.includes("monster") || n.includes("celsius") || n.includes("gatorade")) {
      return "Boisson sucrée ou énergisante — l'eau reste la meilleure option pour le portefeuille et la santé!";
    }
    if (n.includes("restaurant") || n.includes("pizza") || n.includes("mcdonald") || n.includes("burger") || n.includes("poutine") || n.includes("sous-marin") || n.includes("sushi")) {
      return "Repas au restaurant — coûte souvent 3 à 5 fois plus cher que cuisiner à la maison.";
    }
    if (n.includes("kombucha") || n.includes("jus")) {
      return "Boisson de confort — meilleur que les sodas, mais pas indispensable.";
    }
    return "Plaisir alimentaire — délicieux, mais pas indispensable au quotidien.";
  }
  if (item.category === "clothing") {
    if (n.includes("basket") || n.includes("jordan") || n.includes("air force") || n.includes("yeezy") || n.includes("vans") || n.includes("adidas") || n.includes("nike")) {
      return "Chaussures de marque — cool, mais des chaussures ordinaires font le même travail!";
    }
    if (n.includes("sac à main") || n.includes("bijou") || n.includes("montre") || n.includes("lunettes de soleil")) {
      return "Accessoire de mode — envie plutôt que besoin. Peut attendre une occasion spéciale.";
    }
    return "Vêtement non essentiel — demande-toi si tu en as vraiment besoin ou si c'est une envie du moment.";
  }
  if (item.category === "leisure") {
    if (n.includes("netflix") || n.includes("spotify") || n.includes("youtube") || n.includes("disney") || n.includes("apple")) {
      return "Abonnement numérique — pratique, mais peut être partagé pour économiser jusqu'à 50%!";
    }
    if (n.includes("restaurant") || n.includes("pizza") || n.includes("cinéma") || n.includes("bowling") || n.includes("escape")) {
      return "Sortie — agréable, mais coûte plus cher que des activités maison. À planifier dans le budget!";
    }
    if (n.includes("voyage") || n.includes("avion") || n.includes("hôtel")) {
      return "Voyage — une dépense importante! À mettre de côté longtemps à l'avance.";
    }
    return "Divertissement — bon pour le moral! Assure-toi d'avoir d'abord payé tous tes essentiels.";
  }
  return "Article non essentiel — une envie plutôt qu'un besoin.";
}

interface PurchaseFeedback {
  grade: "excellent" | "bien" | "attention" | "alerte";
  title: string;
  message: string;
  tip: string;
}

function getPurchaseFeedback(cart: CartItem[]): PurchaseFeedback {
  const essentialAmt = cart.filter(c => c.item.isEssential).reduce((s, c) => s + c.item.price * c.quantity, 0);
  const totalAmt = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const essentialRatio = totalAmt > 0 ? essentialAmt / totalAmt : 1;
  const hasNonEssential = cart.some(c => !c.item.isEssential);
  const hasEssential = cart.some(c => c.item.isEssential);

  if (!hasNonEssential) {
    return {
      grade: "excellent",
      title: "Achats 100% essentiels!",
      message: "Tous tes achats répondent à des besoins de base. Tu gères ton budget comme un(e) pro!",
      tip: "Continue de prioriser tes essentiels. Pense aussi à mettre de l'argent de côté chaque mois pour l'épargne.",
    };
  }
  if (!hasEssential) {
    return {
      grade: "alerte",
      title: "Que des plaisirs!",
      message: "Aucun de tes achats n'est essentiel ce mois-ci. Assure-toi d'avoir ton loyer, ta nourriture de base et tes autres besoins couverts!",
      tip: "Règle d'or: essentiels d'abord, plaisirs ensuite. Tes besoins de base passent toujours en priorité.",
    };
  }
  if (essentialRatio >= 0.7) {
    return {
      grade: "bien",
      title: "Bon équilibre!",
      message: `${Math.round(essentialRatio * 100)}% de tes dépenses vont vers des essentiels — c'est un très bon ratio!`,
      tip: "La règle 50/30/20 suggère: 50% besoins, 30% désirs, 20% épargne. Tu es sur la bonne voie!",
    };
  }
  return {
    grade: "attention",
    title: "Beaucoup de plaisirs!",
    message: `${Math.round((1 - essentialRatio) * 100)}% de tes achats sont des plaisirs. C'est beaucoup pour un seul passage à la caisse!`,
    tip: "Astuce: avant chaque achat, pose-toi la question — \"Est-ce que j'en ai besoin, ou j'en ai juste envie?\" Cette simple question peut t'économiser des centaines de dollars par année!",
  };
}

export default function Catalog() {
  const { studentId } = useParams();
  const [location, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showPurchaseFeedback, setShowPurchaseFeedback] = useState(false);
  const [purchasedCart, setPurchasedCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const cat = params.get("category");
    if (cat === "food" || cat === "clothing" || cat === "leisure" || cat === "sale") {
      setSelectedCategory(cat);
    }
  }, [location]);

  const studentQuery = useQuery({ queryKey: ["/api/students", studentId] });
  const catalogQuery = useQuery({ queryKey: ["/api/catalog"] });

  const addExpenseMutation = useMutation({
    mutationFn: async (cartItems: CartItem[]) => {
      const promises = cartItems.flatMap(cartItem => {
        const priceWithTax = cartItem.item.isTaxable
          ? cartItem.item.price * (1 + QUEBEC_TAX_RATE)
          : cartItem.item.price;
        const roundedPrice = Math.round(priceWithTax * 100) / 100;
        return Array.from({ length: cartItem.quantity }, () =>
          apiRequest("POST", "/api/expenses", {
            studentId,
            itemId: cartItem.item.id,
            amount: roundedPrice,
            category: cartItem.item.category,
            isEssential: cartItem.item.isEssential,
          })
        );
      });
      await Promise.all(promises);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", studentId] });
      setPurchasedCart(variables);
      setCart([]);
      setShowCheckoutConfirm(false);
      setIsCartOpen(false);
      setShowPurchaseFeedback(true);
    },
  });

  const student = studentQuery.data as Student | undefined;
  const allRawItems = (catalogQuery.data as CatalogItem[]) || [];
  const allItems = applyPromos(allRawItems);
  let filteredItems = selectedCategory === "sale"
    ? allItems.filter(item => !!item.originalPrice)
    : allItems.filter(item => item.category === selectedCategory);
  if ((selectedCategory === "food" || selectedCategory === "leisure") && selectedSubcategory) {
    filteredItems = filteredItems.filter(item => item.subcategory === selectedSubcategory);
  }

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  // When showing grouped view (Tout), don't paginate — show all grouped items
  const isGroupedMode = (selectedCategory === "food" || selectedCategory === "leisure") && !selectedSubcategory;
  const pageItems = isGroupedMode ? filteredItems : filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory(null);
    setCurrentPage(1);
  };

  const handleSubcategoryChange = (subcat: string | null) => {
    setSelectedSubcategory(subcat);
    setCurrentPage(1);
  };

  const addToCart = (item: CatalogItemWithPromo) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev.map(c => {
        if (c.item.id === itemId) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : c;
        }
        return c;
      }).filter(c => c.quantity > 0)
    );
  };

  const calculateCartTotals = () => {
    let subtotal = 0;
    let taxableAmount = 0;
    cart.forEach(cartItem => {
      const itemTotal = cartItem.item.price * cartItem.quantity;
      subtotal += itemTotal;
      if (cartItem.item.isTaxable) taxableAmount += itemTotal;
    });
    const taxes = taxableAmount * QUEBEC_TAX_RATE;
    const total = subtotal + taxes;
    return { subtotal, taxableAmount, taxes, total };
  };

  const cartTotals = calculateCartTotals();
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  if (!student) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  const remaining = student.budget - student.spent;
  const canAffordCart = remaining >= cartTotals.total;

  // Group items by subcategory for food/leisure display
  const groupedItems: { subcat: string | null; icon: string; items: CatalogItemWithPromo[] }[] = [];
  const isCategoryWithSubcats = (selectedCategory === "food" || selectedCategory === "leisure") && !selectedSubcategory;
  if (isCategoryWithSubcats) {
    const subcatList = selectedCategory === "food" ? FOOD_SUBCATEGORIES : LEISURE_SUBCATEGORIES;
    const fallbackIcon = selectedCategory === "food" ? "🛒" : "🎮";
    const grouped: Record<string, CatalogItemWithPromo[]> = {};
    const noSubcat: CatalogItemWithPromo[] = [];
    pageItems.forEach(item => {
      if (item.subcategory) {
        if (!grouped[item.subcategory]) grouped[item.subcategory] = [];
        grouped[item.subcategory].push(item);
      } else {
        noSubcat.push(item);
      }
    });
    subcatList.forEach(sc => {
      if (grouped[sc.id] && grouped[sc.id].length > 0) {
        groupedItems.push({ subcat: sc.id, icon: sc.icon, items: grouped[sc.id] });
      }
    });
    if (noSubcat.length > 0) {
      groupedItems.push({ subcat: null, icon: fallbackIcon, items: noSubcat });
    }
  }

  const useGrouped = isCategoryWithSubcats && groupedItems.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">

      {/* ── CIRCULAIRE HEADER ── */}
      <div className={`${currentCategory?.color} text-white`}>
        {/* Top bar with promo dates */}
        {(() => {
          const { start, end } = getPromoValidDates();
          const fmt = (d: Date) => d.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
          const promoCount = PROMO_SETS[getPromoSetIndex()].length;
          return (
            <div className="bg-black/30 py-1.5 px-4 text-center text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-3 flex-wrap">
              <span>Valide du {fmt(start)} au {fmt(end)}</span>
              <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[10px] font-black">
                {promoCount} ARTICLES EN SOLDE
              </span>
            </div>
          );
        })()}

        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Logo / Title */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(`/student/${studentId}`)}
                variant="secondary"
                size="sm"
                className="shrink-0"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase">
                    CIRCULAIRE
                  </h1>
                  <span className="text-lg md:text-2xl font-light opacity-80">Mon Budget en Or</span>
                </div>
                <p className="text-white/80 text-sm mt-0.5">
                  Les meilleurs prix cette semaine &mdash; {currentCategory?.name}
                </p>
              </div>
            </div>

            {/* Budget pill + Cart */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white/15 border border-white/30 rounded-lg px-4 py-2 text-center">
                <p className="text-xs uppercase tracking-wide opacity-80">Budget disponible</p>
                <p className={`text-xl font-black ${remaining < 0 ? "text-red-300" : "text-yellow-300"}`}>
                  {remaining.toFixed(2)} $
                </p>
              </div>

              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="relative font-bold text-base px-5"
                    data-testid="button-open-cart"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Mon panier
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center border-2 border-white">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>

                {/* ── CART SHEET ── */}
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-xl">
                      <ShoppingCart className="w-6 h-6" />
                      Mon Panier ({cartItemCount} article{cartItemCount !== 1 ? "s" : ""})
                    </SheetTitle>
                    <SheetDescription>Vérifiez vos achats avant de payer</SheetDescription>
                  </SheetHeader>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-semibold">Votre panier est vide</p>
                        <p className="text-sm">Ajoutez des articles pour commencer</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="flex-1 -mx-6 px-6">
                        <div className="space-y-2 py-4">
                          {cart.map(cartItem => (
                            <div key={cartItem.item.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                              <div className="text-3xl w-10 text-center shrink-0">
                                {getProductEmoji(cartItem.item.name, cartItem.item.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{cartItem.item.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-red-600 dark:text-red-400 font-black text-sm">
                                    {cartItem.item.price.toFixed(2)} $
                                  </span>
                                  {cartItem.item.isTaxable && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">+tx</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(cartItem.item.id, -1)} data-testid={`button-decrease-${cartItem.item.id}`}>
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-7 text-center font-black text-sm">{cartItem.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(cartItem.item.id, 1)} data-testid={`button-increase-${cartItem.item.id}`}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(cartItem.item.id)} data-testid={`button-remove-${cartItem.item.id}`}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Receipt */}
                      <div className="border-t pt-4 space-y-3">
                        <div className="bg-muted/60 rounded-lg p-4 space-y-1.5 font-mono text-sm border">
                          <div className="text-center border-b border-dashed pb-2 mb-2">
                            <Receipt className="w-5 h-5 mx-auto mb-1" />
                            <p className="font-bold">REÇU DE CAISSE</p>
                          </div>
                          <div className="flex justify-between"><span>Sous-total:</span><span>{cartTotals.subtotal.toFixed(2)} $</span></div>
                          {cartTotals.taxableAmount > 0 && (
                            <div className="flex justify-between text-muted-foreground text-xs">
                              <span>TPS + TVQ (14,975%):</span>
                              <span>{cartTotals.taxes.toFixed(2)} $</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-black text-lg">
                            <span>TOTAL:</span>
                            <span className="text-red-600 dark:text-red-400">{cartTotals.total.toFixed(2)} $</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-sm px-1">
                          <span className="text-muted-foreground">Budget restant après l'achat:</span>
                          <span className={`font-bold ${(remaining - cartTotals.total) < 0 ? "text-destructive" : "text-green-600"}`}>
                            {(remaining - cartTotals.total).toFixed(2)} $
                          </span>
                        </div>

                        {!canAffordCart && (
                          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                            <p className="text-sm text-destructive font-semibold">
                              Budget insuffisant! Manque: {(cartTotals.total - remaining).toFixed(2)} $
                            </p>
                          </div>
                        )}
                      </div>

                      <SheetFooter className="mt-3">
                        <Button
                          className="w-full font-black text-lg py-6 bg-red-600 hover:bg-red-700"
                          size="lg"
                          disabled={!canAffordCart || addExpenseMutation.isPending || cart.length === 0}
                          onClick={() => setShowCheckoutConfirm(true)}
                          data-testid="button-checkout"
                        >
                          {addExpenseMutation.isPending ? "Traitement..." : `Payer ${cartTotals.total.toFixed(2)} $`}
                        </Button>
                      </SheetFooter>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="bg-black/20">
          <div className="max-w-7xl mx-auto px-4 flex gap-0 overflow-x-auto">
            {CATEGORIES.map(cat => {
              const saleCount = cat.id === "sale" ? allItems.filter(i => !!i.originalPrice).length : 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`shrink-0 px-5 py-3 font-black uppercase tracking-wide text-sm transition-all flex items-center gap-2 border-b-4 ${
                    selectedCategory === cat.id
                      ? cat.id === "sale" ? "border-yellow-400 bg-yellow-500/20 text-white" : "border-yellow-400 bg-white/20 text-white"
                      : "border-transparent text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  data-testid={`button-category-${cat.id}`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                  {cat.id === "sale" && saleCount > 0 && (
                    <span className="bg-yellow-400 text-black text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {saleCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SUBCATEGORY FILTERS ── */}
      {(selectedCategory === "food" || selectedCategory === "leisure") && (() => {
        const subcats = selectedCategory === "food" ? FOOD_SUBCATEGORIES : LEISURE_SUBCATEGORIES;
        const activeColor = selectedCategory === "food" ? "bg-red-600 border-red-600" : "bg-purple-600 border-purple-600";
        const hoverColor = selectedCategory === "food" ? "hover:border-red-400" : "hover:border-purple-400";
        const allIcon = selectedCategory === "food" ? "🛒" : "🎮";
        return (
          <div className="bg-white dark:bg-gray-900 border-b shadow-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
              <button
                onClick={() => handleSubcategoryChange(null)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all ${
                  selectedSubcategory === null
                    ? `${activeColor} text-white`
                    : `bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-foreground ${hoverColor}`
                }`}
                data-testid="button-subcategory-all"
              >
                {allIcon} Tout
              </button>
              {subcats.map(subcat => (
                <button
                  key={subcat.id}
                  onClick={() => handleSubcategoryChange(subcat.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${
                    selectedSubcategory === subcat.id
                      ? `${activeColor} text-white`
                      : `bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-foreground ${hoverColor}`
                  }`}
                  data-testid={`button-subcategory-${subcat.id}`}
                >
                  <span>{subcat.icon}</span> {subcat.id}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-6">

        {/* Cart summary bar */}
        {cartItemCount > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="w-4 h-4 text-yellow-600" />
              <span>{cartItemCount} article{cartItemCount !== 1 ? "s" : ""} dans le panier</span>
              <span className="text-muted-foreground">&mdash; Total: <strong className="text-red-600 dark:text-red-400">{cartTotals.total.toFixed(2)} $</strong></span>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => setIsCartOpen(true)} data-testid="button-view-cart-bar">
              Voir le panier
            </Button>
          </div>
        )}

        {/* Products — grouped or flat */}
        {useGrouped ? (
          <div className="space-y-8">
            {groupedItems.map(group => (
              <div key={group.subcat ?? "other"}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-red-700 text-white px-4 py-1.5 rounded-r-full -ml-3 md:-ml-4">
                    <span className="text-xl">{group.icon}</span>
                    <span className="font-black text-base uppercase tracking-wide">{group.subcat ?? "Autres"}</span>
                  </div>
                  <div className="flex-1 h-px bg-red-200 dark:bg-red-900" />
                </div>
                <ProductGrid items={group.items} cart={cart} addToCart={addToCart} />
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid items={pageItems} cart={cart} addToCart={addToCart} />
        )}

        {pageItems.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">Aucun article dans cette catégorie</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} data-testid="button-prev-page">
              Précédent
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  data-testid={`button-page-${page}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} data-testid="button-next-page">
              Suivant
            </Button>
          </div>
        )}

        {/* Tax info footer */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm flex items-start gap-3">
          <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-blue-800 dark:text-blue-200">Taxes du Québec (TPS + TVQ)</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Les aliments de base (lait, pain, viandes, fruits, légumes) ne sont <strong>pas taxés</strong>.
              Les bonbons, chips, boissons sucrées et articles non alimentaires sont taxés à <strong>14,975%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Floating cart (mobile) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden z-40">
          <button
            className="bg-red-600 text-white rounded-full w-16 h-16 shadow-xl flex items-center justify-center relative border-4 border-white"
            onClick={() => setIsCartOpen(true)}
            data-testid="button-floating-cart"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center border-2 border-white">
              {cartItemCount}
            </span>
          </button>
        </div>
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Confirmer l'achat
            </DialogTitle>
            <DialogDescription>Vérifiez votre commande avant de payer</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 font-mono text-sm max-h-48 overflow-auto border">
              {cart.map(cartItem => (
                <div key={cartItem.item.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1">{cartItem.quantity}x {cartItem.item.name}</span>
                  <span className="ml-2 font-bold">{(cartItem.item.price * cartItem.quantity).toFixed(2)} $</span>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Sous-total:</span><span>{cartTotals.subtotal.toFixed(2)} $</span></div>
              {cartTotals.taxes > 0 && (
                <div className="flex justify-between text-muted-foreground text-xs"><span>Taxes (TPS + TVQ):</span><span>{cartTotals.taxes.toFixed(2)} $</span></div>
              )}
              <Separator />
              <div className="flex justify-between font-black text-lg">
                <span>Total à payer:</span>
                <span className="text-red-600 dark:text-red-400">{cartTotals.total.toFixed(2)} $</span>
              </div>
            </div>

            <div className="flex justify-between p-3 bg-muted rounded-lg text-sm">
              <span>Budget restant après l'achat:</span>
              <span className={`font-bold ${(remaining - cartTotals.total) < 0 ? "text-destructive" : "text-green-600"}`}>
                {(remaining - cartTotals.total).toFixed(2)} $
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowCheckoutConfirm(false)} data-testid="button-cancel-checkout">
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 font-black"
              onClick={() => addExpenseMutation.mutate(cart)}
              disabled={addExpenseMutation.isPending}
              data-testid="button-confirm-checkout"
            >
              {addExpenseMutation.isPending ? "Traitement..." : "Confirmer et payer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PURCHASE FEEDBACK MODAL ── */}
      {(() => {
        if (!showPurchaseFeedback || purchasedCart.length === 0) return null;
        const feedback = getPurchaseFeedback(purchasedCart);
        const nonEssentialItems = purchasedCart.filter(c => !c.item.isEssential);
        const essentialItems = purchasedCart.filter(c => c.item.isEssential);
        const totalPaid = purchasedCart.reduce((s, c) => {
          const price = c.item.isTaxable ? c.item.price * (1 + QUEBEC_TAX_RATE) : c.item.price;
          return s + price * c.quantity;
        }, 0);

        const gradeConfig = {
          excellent: { Icon: CheckCircle2, bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-300 dark:border-green-700", iconColor: "text-green-600", titleColor: "text-green-700 dark:text-green-400", badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
          bien: { Icon: ThumbsUp, bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-300 dark:border-blue-700", iconColor: "text-blue-600", titleColor: "text-blue-700 dark:text-blue-400", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
          attention: { Icon: AlertTriangle, bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-300 dark:border-yellow-700", iconColor: "text-yellow-600", titleColor: "text-yellow-700 dark:text-yellow-400", badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
          alerte: { Icon: AlertCircle, bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-300 dark:border-red-700", iconColor: "text-red-600", titleColor: "text-red-700 dark:text-red-400", badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
        }[feedback.grade];
        const { Icon } = gradeConfig;

        return (
          <Dialog open={showPurchaseFeedback} onOpenChange={setShowPurchaseFeedback}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col" data-testid="dialog-purchase-feedback">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Achat complété — {totalPaid.toFixed(2)} $
                </DialogTitle>
                <DialogDescription>Voici une analyse de tes achats</DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-1">
                  {/* Grade Banner */}
                  <div className={`rounded-lg border p-4 flex items-start gap-3 ${gradeConfig.bg} ${gradeConfig.border}`}>
                    <Icon className={`w-6 h-6 shrink-0 mt-0.5 ${gradeConfig.iconColor}`} />
                    <div>
                      <p className={`font-black text-base ${gradeConfig.titleColor}`}>{feedback.title}</p>
                      <p className="text-sm text-foreground/80 mt-0.5">{feedback.message}</p>
                    </div>
                  </div>

                  {/* Essential items */}
                  {essentialItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-green-600" />
                        <p className="font-bold text-sm text-green-700 dark:text-green-400">Essentiels ({essentialItems.length} article{essentialItems.length > 1 ? "s" : ""})</p>
                      </div>
                      <div className="space-y-1.5">
                        {essentialItems.map(cartItem => (
                          <div key={cartItem.item.id} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <span className="text-xl w-8 text-center shrink-0">{getProductEmoji(cartItem.item.name, cartItem.item.category)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{cartItem.quantity > 1 ? `${cartItem.quantity}x ` : ""}{cartItem.item.name}</p>
                              <p className="text-xs text-green-700 dark:text-green-400">Besoin essentiel — bon choix!</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-xs border-green-400 text-green-700 dark:text-green-400">
                              {(cartItem.item.price * cartItem.quantity).toFixed(2)} $
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Non-essential items */}
                  {nonEssentialItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <p className="font-bold text-sm text-amber-700 dark:text-amber-400">Plaisirs ({nonEssentialItems.length} article{nonEssentialItems.length > 1 ? "s" : ""})</p>
                      </div>
                      <div className="space-y-1.5">
                        {nonEssentialItems.map(cartItem => (
                          <div key={cartItem.item.id} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <span className="text-xl w-8 text-center shrink-0 mt-0.5">{getProductEmoji(cartItem.item.name, cartItem.item.category)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{cartItem.quantity > 1 ? `${cartItem.quantity}x ` : ""}{cartItem.item.name}</p>
                              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{getItemExplanation(cartItem.item)}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-xs border-amber-400 text-amber-700 dark:text-amber-400">
                              {(cartItem.item.price * cartItem.quantity).toFixed(2)} $
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tip */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted border">
                    <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm mb-0.5">Conseil budgétaire</p>
                      <p className="text-sm text-muted-foreground">{feedback.tip}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setShowPurchaseFeedback(false); navigate(`/student/${studentId}`); }}
                  data-testid="button-feedback-go-dashboard"
                >
                  Retour au tableau de bord
                </Button>
                <Button
                  onClick={() => setShowPurchaseFeedback(false)}
                  data-testid="button-feedback-continue"
                >
                  Continuer mes achats
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}

// ── Product Grid Component ──
function ProductGrid({ items, cart, addToCart }: {
  items: CatalogItemWithPromo[];
  cart: CartItem[];
  addToCart: (item: CatalogItemWithPromo) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map(item => {
        const cartItem = cart.find(c => c.item.id === item.id);
        const isOnSale = !!item.originalPrice;
        const priceWithTax = item.isTaxable
          ? item.price * (1 + QUEBEC_TAX_RATE)
          : item.price;

        return (
          <div
            key={item.id}
            className={`bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col transition-colors group relative ${
              isOnSale
                ? "border-2 border-yellow-400 dark:border-yellow-500 hover:border-yellow-500 dark:hover:border-yellow-400 shadow-md"
                : "border-2 border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-600"
            }`}
            data-testid={`card-product-${item.id}`}
          >
            {/* Quantity badge */}
            {cartItem && (
              <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center shadow">
                {cartItem.quantity}
              </div>
            )}

            {/* SPÉCIAL ribbon — top left when on sale */}
            {isOnSale && !cartItem && (
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg tracking-wider shadow">
                  SPÉCIAL
                </div>
              </div>
            )}

            {/* Essential / Plaisir badge top-right */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
              {item.isEssential ? (
                <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-green-300 dark:border-green-700">
                  <Leaf className="w-2.5 h-2.5" />
                  Essentiel
                </span>
              ) : (
                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-300 dark:border-amber-700">
                  <Star className="w-2.5 h-2.5" />
                  Plaisir
                </span>
              )}
            </div>

            {/* Product image */}
            {(() => {
              const img = getProductImage(item.name, item.category);
              return (
                <div className={`relative pt-2 pb-1 flex items-center justify-center h-28 overflow-hidden ${isOnSale ? "bg-yellow-50 dark:bg-yellow-900/10" : "bg-gray-50 dark:bg-gray-800/30"}`}>
                  {img ? (
                    <img
                      src={img}
                      alt={item.name}
                      className="h-24 w-24 object-contain group-hover:scale-110 transition-transform duration-200 drop-shadow-md"
                    />
                  ) : (
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-200 block drop-shadow-sm">
                      {getProductEmoji(item.name, item.category)}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Product info */}
            <div className="flex flex-col flex-1 p-2">
              <p className="font-bold text-xs leading-tight line-clamp-2 min-h-[2.5rem] text-foreground">
                {item.name}
              </p>

              {/* Price tag */}
              <div className="mt-1.5 space-y-0.5">
                {isOnSale && item.originalPrice && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground text-xs line-through">
                      {item.originalPrice.toFixed(2)} $
                    </span>
                    <span className="bg-red-600 text-white text-[9px] font-black px-1 py-0 rounded">
                      -{item.discountPct}%
                    </span>
                  </div>
                )}
                <div className={`font-black text-xl leading-none ${isOnSale ? "text-red-700 dark:text-red-400" : "text-red-600 dark:text-red-400"}`}>
                  {item.price.toFixed(2)}<span className="text-sm font-bold"> $</span>
                </div>
                {item.isTaxable && (
                  <p className="text-[10px] text-muted-foreground">
                    {priceWithTax.toFixed(2)} $ avec taxes
                  </p>
                )}
                {isOnSale && item.originalPrice && (
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">
                    Économisez {(item.originalPrice - item.price).toFixed(2)} $
                  </p>
                )}
              </div>

              {/* Add to cart */}
              <button
                onClick={() => addToCart(item)}
                className={`mt-2 w-full text-white text-xs font-black py-2 rounded-md flex items-center justify-center gap-1 transition-colors ${
                  isOnSale
                    ? "bg-red-700 hover:bg-red-800 active:bg-red-900"
                    : "bg-red-600 hover:bg-red-700 active:bg-red-800"
                }`}
                data-testid={`button-add-${item.id}`}
              >
                <Plus className="w-3.5 h-3.5" />
                {isOnSale ? "Profiter du rabais" : "Ajouter"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
