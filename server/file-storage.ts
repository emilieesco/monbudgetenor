import { type Student, type CatalogItem, type Expense, type FixedExpense, type InsertStudent, type InsertCatalogItem, type InsertExpense, type Class, type CreateClass, type BonusExpense, type CreateBonusExpense, type Challenge, type CreateChallenge, type CustomChallenge, type CreateCustomChallenge, type TeacherMessage, type CreateTeacherMessage, type SurpriseEvent, type CreateSurpriseEvent, type BudgetSnapshot, type Badge, type SavingsGoal, type CreateSavingsGoal, type ClassChallenge, type CreateClassChallenge } from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { IStorage } from "./storage";

interface StorageData {
  classes: Record<string, Class>;
  students: Record<string, Student>;
  catalogItems: Record<string, CatalogItem>;
  expenses: Record<string, Expense>;
  fixedExpenses: Record<string, FixedExpense>;
  bonusExpenses: Record<string, BonusExpense>;
  challenges: Record<string, Challenge>;
  customChallenges: Record<string, CustomChallenge>;
  teacherMessages: Record<string, TeacherMessage>;
  surpriseEvents: Record<string, SurpriseEvent>;
  snapshots: Record<string, BudgetSnapshot>;
  badges: Record<string, Badge>;
  savingsGoals: Record<string, SavingsGoal>;
  classChallenges: Record<string, ClassChallenge>;
}

export class FileStorage implements IStorage {
  private dataFile: string;
  private classes: Map<string, Class> = new Map();
  private students: Map<string, Student> = new Map();
  private catalogItems: Map<string, CatalogItem> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private fixedExpenses: Map<string, FixedExpense> = new Map();
  private bonusExpenses: Map<string, BonusExpense> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private customChallenges: Map<string, CustomChallenge> = new Map();
  private teacherMessages: Map<string, TeacherMessage> = new Map();
  private surpriseEvents: Map<string, SurpriseEvent> = new Map();
  private snapshots: Map<string, BudgetSnapshot> = new Map();
  private badges: Map<string, Badge> = new Map();
  private savingsGoals: Map<string, SavingsGoal> = new Map();
  private classChallenges: Map<string, ClassChallenge> = new Map();

  constructor() {
    this.dataFile = join(process.cwd(), "data.json");
    this.load();
    this.initializeCatalogIfEmpty();
  }

  private load() {
    try {
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, "utf-8")) as StorageData;
        
        if (data.classes) {
          for (const [key, value] of Object.entries(data.classes)) {
            this.classes.set(key, { ...value, createdAt: new Date(value.createdAt) });
          }
        }
        if (data.students) {
          for (const [key, value] of Object.entries(data.students)) {
            this.students.set(key, { ...value, createdAt: new Date(value.createdAt) });
          }
        }
        if (data.catalogItems) {
          for (const [key, value] of Object.entries(data.catalogItems)) {
            this.catalogItems.set(key, value);
          }
        }
        if (data.expenses) {
          for (const [key, value] of Object.entries(data.expenses)) {
            this.expenses.set(key, { ...value, timestamp: new Date(value.timestamp) });
          }
        }
        if (data.fixedExpenses) {
          for (const [key, value] of Object.entries(data.fixedExpenses)) {
            this.fixedExpenses.set(key, { ...value, dueDate: new Date(value.dueDate) });
          }
        }
        if (data.bonusExpenses) {
          for (const [key, value] of Object.entries(data.bonusExpenses)) {
            this.bonusExpenses.set(key, { ...value, createdAt: new Date(value.createdAt) });
          }
        }
        if (data.challenges) {
          for (const [key, value] of Object.entries(data.challenges)) {
            this.challenges.set(key, { ...value, createdAt: new Date(value.createdAt) });
          }
        }
        if (data.customChallenges) {
          for (const [key, value] of Object.entries(data.customChallenges)) {
            this.customChallenges.set(key, { ...value, createdAt: new Date(value.createdAt) });
          }
        }
        if (data.teacherMessages) {
          for (const [key, value] of Object.entries(data.teacherMessages)) {
            this.teacherMessages.set(key, { ...value, timestamp: new Date(value.timestamp) });
          }
        }
        if (data.surpriseEvents) {
          for (const [key, value] of Object.entries(data.surpriseEvents)) {
            this.surpriseEvents.set(key, { ...value, createdAt: new Date(value.createdAt), appliedAt: value.appliedAt ? new Date(value.appliedAt) : undefined });
          }
        }
        if (data.snapshots) {
          for (const [key, value] of Object.entries(data.snapshots)) {
            this.snapshots.set(key, { ...value, createdAt: new Date(value.createdAt) });
          }
        }
        if (data.badges) {
          for (const [key, value] of Object.entries(data.badges)) {
            this.badges.set(key, { ...value, earnedAt: new Date(value.earnedAt) });
          }
        }
        if (data.savingsGoals) {
          for (const [key, value] of Object.entries(data.savingsGoals)) {
            this.savingsGoals.set(key, { 
              ...value, 
              createdAt: new Date(value.createdAt),
              deadline: value.deadline ? new Date(value.deadline) : undefined 
            });
          }
        }
        if (data.classChallenges) {
          for (const [key, value] of Object.entries(data.classChallenges)) {
            this.classChallenges.set(key, { 
              ...value, 
              createdAt: new Date(value.createdAt),
              deadline: value.deadline ? new Date(value.deadline) : undefined 
            });
          }
        }
        console.log("Data loaded from file");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  private save() {
    try {
      const data: StorageData = {
        classes: Object.fromEntries(this.classes),
        students: Object.fromEntries(this.students),
        catalogItems: Object.fromEntries(this.catalogItems),
        expenses: Object.fromEntries(this.expenses),
        fixedExpenses: Object.fromEntries(this.fixedExpenses),
        bonusExpenses: Object.fromEntries(this.bonusExpenses),
        challenges: Object.fromEntries(this.challenges),
        customChallenges: Object.fromEntries(this.customChallenges),
        teacherMessages: Object.fromEntries(this.teacherMessages),
        surpriseEvents: Object.fromEntries(this.surpriseEvents),
        snapshots: Object.fromEntries(this.snapshots),
        badges: Object.fromEntries(this.badges),
        savingsGoals: Object.fromEntries(this.savingsGoals),
        classChallenges: Object.fromEntries(this.classChallenges),
      };
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  private initializeCatalogIfEmpty() {
    if (this.catalogItems.size === 0) {
      // Au Québec: TPS 5% + TVQ 9.975% = 14.975% (~15%)
      // Produits alimentaires de base = NON TAXÉS
      // Bonbons, chips, sodas, chocolat = TAXÉS
      const defaultItems: CatalogItem[] = [
        // Produits laitiers - NON TAXÉS (aliments de base)
        { id: randomUUID(), name: "Lait 2% 2L", price: 4.99, category: "food", subcategory: "Produits Laitiers", description: "Lait partiellement écrémé", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Lait 3.25% 2L", price: 5.29, category: "food", subcategory: "Produits Laitiers", description: "Lait entier homogénéisé", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Yogourt nature 650g", price: 4.49, category: "food", subcategory: "Produits Laitiers", description: "Yogourt nature sans sucre", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Fromage cheddar 400g", price: 7.99, category: "food", subcategory: "Produits Laitiers", description: "Cheddar fort vieilli", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Beurre salé 454g", price: 5.99, category: "food", subcategory: "Produits Laitiers", description: "Beurre de laiterie", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Crème 35% 473ml", price: 4.29, category: "food", subcategory: "Produits Laitiers", description: "Crème à fouetter", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Mozzarella 340g", price: 6.49, category: "food", subcategory: "Produits Laitiers", description: "Fromage mozzarella", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Crème sure 500ml", price: 3.49, category: "food", subcategory: "Produits Laitiers", description: "Crème sure 14%", isEssential: false, isTaxable: false },
        
        // Viandes et œufs - NON TAXÉS
        { id: randomUUID(), name: "Poulet entier 1.5kg", price: 12.99, category: "food", subcategory: "Viandes", description: "Poulet frais entier", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Œufs gros calibre 12", price: 4.99, category: "food", subcategory: "Viandes", description: "Œufs frais grade A", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Bœuf haché mi-maigre 450g", price: 7.99, category: "food", subcategory: "Viandes", description: "Bœuf haché frais", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Poitrines de poulet 900g", price: 15.99, category: "food", subcategory: "Viandes", description: "Poitrines désossées", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Côtelettes de porc 600g", price: 9.99, category: "food", subcategory: "Viandes", description: "Côtelettes avec os", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Bacon 375g", price: 6.99, category: "food", subcategory: "Viandes", description: "Bacon tranché", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Saumon filet 400g", price: 14.99, category: "food", subcategory: "Viandes", description: "Filet de saumon atlantique", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Crevettes 340g", price: 12.99, category: "food", subcategory: "Viandes", description: "Crevettes décortiquées", isEssential: false, isTaxable: false },
        
        // Fruits et légumes - NON TAXÉS
        { id: randomUUID(), name: "Bananes", price: 1.49, category: "food", subcategory: "Fruits & Légumes", description: "Bananes fraîches /lb", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Pommes Gala 3lb", price: 4.99, category: "food", subcategory: "Fruits & Légumes", description: "Pommes Gala en sac", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Oranges Navel 4lb", price: 6.99, category: "food", subcategory: "Fruits & Légumes", description: "Oranges juteuses", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Carottes 2lb", price: 2.49, category: "food", subcategory: "Fruits & Légumes", description: "Carottes fraîches", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Brocoli", price: 2.99, category: "food", subcategory: "Fruits & Légumes", description: "Brocoli frais", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Tomates grappe", price: 3.99, category: "food", subcategory: "Fruits & Légumes", description: "Tomates sur vigne /lb", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Laitue romaine", price: 2.99, category: "food", subcategory: "Fruits & Légumes", description: "Laitue fraîche", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Pommes de terre 10lb", price: 5.99, category: "food", subcategory: "Fruits & Légumes", description: "Pommes de terre russet", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Oignons 3lb", price: 3.49, category: "food", subcategory: "Fruits & Légumes", description: "Oignons jaunes", isEssential: true, isTaxable: false },
        
        // Conserves et pâtes - NON TAXÉS (aliments de base)
        { id: randomUUID(), name: "Pâtes spaghetti 900g", price: 2.49, category: "food", subcategory: "Conserves", description: "Spaghetti Catelli", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Riz blanc 2kg", price: 4.99, category: "food", subcategory: "Conserves", description: "Riz à grain long", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Sauce tomate 680ml", price: 2.99, category: "food", subcategory: "Conserves", description: "Sauce tomate Classico", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Tomates en dés 796ml", price: 1.99, category: "food", subcategory: "Conserves", description: "Tomates italiennes", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Haricots rouges 540ml", price: 1.49, category: "food", subcategory: "Conserves", description: "Haricots en conserve", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Thon pâle 170g", price: 2.49, category: "food", subcategory: "Conserves", description: "Thon en morceaux", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Maïs en crème 398ml", price: 1.79, category: "food", subcategory: "Conserves", description: "Maïs sucré", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Soupe poulet nouilles", price: 1.99, category: "food", subcategory: "Conserves", description: "Soupe Campbell's", isEssential: false, isTaxable: false },
        
        // Boulangerie - NON TAXÉS (pain de base)
        { id: randomUUID(), name: "Pain tranché blanc", price: 2.99, category: "food", subcategory: "Boulangerie", description: "Pain blanc 675g", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Pain blé entier", price: 3.49, category: "food", subcategory: "Boulangerie", description: "Pain 100% blé 675g", isEssential: true, isTaxable: false },
        { id: randomUUID(), name: "Bagels nature 6", price: 3.99, category: "food", subcategory: "Boulangerie", description: "Bagels frais", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Tortillas 10po 8", price: 3.49, category: "food", subcategory: "Boulangerie", description: "Tortillas de blé", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Croissants 6", price: 4.99, category: "food", subcategory: "Boulangerie", description: "Croissants au beurre", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Muffins anglais 6", price: 3.29, category: "food", subcategory: "Boulangerie", description: "Muffins anglais", isEssential: false, isTaxable: false },
        
        // Bonbons & Sucreries - TAXÉS (produits non essentiels)
        { id: randomUUID(), name: "Chocolat Lindt 100g", price: 4.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Chocolat noir 70%", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Chips Lays 235g", price: 4.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Chips nature", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Bonbons gélifiés 175g", price: 2.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Oursons gélifiés", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Biscuits Oreo 303g", price: 3.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Biscuits Oreo", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Barres Oh Henry 4", price: 4.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Barres chocolatées", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Crème glacée 1.5L", price: 5.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Crème glacée vanille", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Popcorn micro-ondes 3", price: 3.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Popcorn au beurre", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Doritos Nacho 255g", price: 4.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Tortillas nacho", isEssential: false, isTaxable: true },
        
        // Boissons - Certaines TAXÉES
        { id: randomUUID(), name: "Jus d'orange 1.89L", price: 4.99, category: "food", subcategory: "Boissons", description: "Jus 100% pur", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Pepsi 2L", price: 2.99, category: "food", subcategory: "Boissons", description: "Boisson gazeuse", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Coca-Cola 2L", price: 2.99, category: "food", subcategory: "Boissons", description: "Boisson gazeuse", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Eau Eska 12x500ml", price: 3.99, category: "food", subcategory: "Boissons", description: "Eau de source", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Café moulu 340g", price: 8.99, category: "food", subcategory: "Boissons", description: "Café Maxwell House", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Thé Red Rose 72", price: 5.99, category: "food", subcategory: "Boissons", description: "Sachets de thé", isEssential: false, isTaxable: false },
        { id: randomUUID(), name: "Gatorade 950ml", price: 2.49, category: "food", subcategory: "Boissons", description: "Boisson sportive", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Jus de pomme 1.89L", price: 3.99, category: "food", subcategory: "Boissons", description: "Jus 100% pomme", isEssential: false, isTaxable: false },
        
        // Vêtements Hauts - TAXÉS
        { id: randomUUID(), name: "T-shirt uni coton", price: 14.99, category: "clothing", subcategory: "Hauts", description: "T-shirt 100% coton basique", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "T-shirt graphique", price: 24.99, category: "clothing", subcategory: "Hauts", description: "T-shirt avec imprimé tendance", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Polo sport", price: 34.99, category: "clothing", subcategory: "Hauts", description: "Polo respirant polyester", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Chemise Oxford", price: 44.99, category: "clothing", subcategory: "Hauts", description: "Chemise classique bureau", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Chandail à capuche", price: 49.99, category: "clothing", subcategory: "Hauts", description: "Hoodie molleton chaud", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Pull en laine", price: 59.99, category: "clothing", subcategory: "Hauts", description: "Pull tricot laine mérinos", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Cardigan", price: 54.99, category: "clothing", subcategory: "Hauts", description: "Cardigan boutonné classique", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Débardeur sport", price: 19.99, category: "clothing", subcategory: "Hauts", description: "Camisole entraînement", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Blouse élégante", price: 39.99, category: "clothing", subcategory: "Hauts", description: "Blouse pour occasions", isEssential: false, isTaxable: true },
        
        // Vêtements Bas - TAXÉS
        { id: randomUUID(), name: "Jeans classique", price: 49.99, category: "clothing", subcategory: "Bas", description: "Jeans denim coupe droite", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Jeans slim", price: 59.99, category: "clothing", subcategory: "Bas", description: "Jeans coupe ajustée", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Pantalon chino", price: 44.99, category: "clothing", subcategory: "Bas", description: "Chino coton polyvalent", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Pantalon jogging", price: 34.99, category: "clothing", subcategory: "Bas", description: "Jogger confortable molleton", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Short sport", price: 24.99, category: "clothing", subcategory: "Bas", description: "Short basketball respirant", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Bermuda cargo", price: 34.99, category: "clothing", subcategory: "Bas", description: "Bermuda multi-poches été", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Legging sport", price: 29.99, category: "clothing", subcategory: "Bas", description: "Legging compression yoga", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Pantalon habillé", price: 64.99, category: "clothing", subcategory: "Bas", description: "Pantalon formel travail", isEssential: true, isTaxable: true },
        
        // Vêtements Extérieur - TAXÉS
        { id: randomUUID(), name: "Manteau hiver Kanuk", price: 299.99, category: "clothing", subcategory: "Extérieur", description: "Manteau grand froid -30°C", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Parka mi-saison", price: 149.99, category: "clothing", subcategory: "Extérieur", description: "Parka automne/printemps", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Veste imperméable", price: 89.99, category: "clothing", subcategory: "Extérieur", description: "Coupe-vent imperméable", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Doudoune légère", price: 119.99, category: "clothing", subcategory: "Extérieur", description: "Veste matelassée compactable", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Manteau laine", price: 179.99, category: "clothing", subcategory: "Extérieur", description: "Manteau classique laine", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Veste denim", price: 69.99, category: "clothing", subcategory: "Extérieur", description: "Veste jeans classique", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Blouson cuir", price: 199.99, category: "clothing", subcategory: "Extérieur", description: "Blouson simili-cuir", isEssential: false, isTaxable: true },
        
        // Chaussures - TAXÉS
        { id: randomUUID(), name: "Espadrilles Nike", price: 89.99, category: "clothing", subcategory: "Chaussures", description: "Sneakers sport tendance", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Bottes hiver Sorel", price: 149.99, category: "clothing", subcategory: "Chaussures", description: "Bottes imperméables -32°C", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Chaussures course", price: 119.99, category: "clothing", subcategory: "Chaussures", description: "Running Asics/Brooks", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Sandales été", price: 34.99, category: "clothing", subcategory: "Chaussures", description: "Sandales confortables", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Souliers habillés", price: 79.99, category: "clothing", subcategory: "Chaussures", description: "Chaussures formelles", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Bottes pluie", price: 49.99, category: "clothing", subcategory: "Chaussures", description: "Bottes caoutchouc Hunter", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Pantoufles maison", price: 24.99, category: "clothing", subcategory: "Chaussures", description: "Pantoufles doublées", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Crocs classiques", price: 44.99, category: "clothing", subcategory: "Chaussures", description: "Sabots confort", isEssential: false, isTaxable: true },
        
        // Accessoires vestimentaires - TAXÉS
        { id: randomUUID(), name: "Chaussettes 6 paires", price: 14.99, category: "clothing", subcategory: "Accessoires", description: "Chaussettes coton sport", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Sous-vêtements 3 pack", price: 24.99, category: "clothing", subcategory: "Accessoires", description: "Boxers/culottes coton", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Ceinture cuir", price: 29.99, category: "clothing", subcategory: "Accessoires", description: "Ceinture classique", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Tuque laine", price: 19.99, category: "clothing", subcategory: "Accessoires", description: "Tuque chaude hiver", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Gants hiver", price: 24.99, category: "clothing", subcategory: "Accessoires", description: "Gants isolés tactiles", isEssential: true, isTaxable: true },
        { id: randomUUID(), name: "Foulard laine", price: 29.99, category: "clothing", subcategory: "Accessoires", description: "Écharpe chaude tricot", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Casquette sport", price: 24.99, category: "clothing", subcategory: "Accessoires", description: "Casquette ajustable", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Lunettes soleil", price: 19.99, category: "clothing", subcategory: "Accessoires", description: "Lunettes UV protection", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Sac à dos", price: 49.99, category: "clothing", subcategory: "Accessoires", description: "Sac école/travail", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Parapluie compact", price: 14.99, category: "clothing", subcategory: "Accessoires", description: "Parapluie pliable", isEssential: false, isTaxable: true },
        
        // Loisirs Divertissement - TAXÉS
        { id: randomUUID(), name: "Billet cinéma Cineplex", price: 15.99, category: "leisure", subcategory: "Divertissement", description: "Film régulier en salle", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Cinéma IMAX", price: 21.99, category: "leisure", subcategory: "Divertissement", description: "Expérience IMAX/3D", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Netflix mensuel", price: 16.49, category: "leisure", subcategory: "Divertissement", description: "Abonnement streaming", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Spotify Premium", price: 10.99, category: "leisure", subcategory: "Divertissement", description: "Musique illimitée mensuel", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Ticket concert local", price: 45.00, category: "leisure", subcategory: "Divertissement", description: "Concert salle moyenne", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Festival Osheaga", price: 149.00, category: "leisure", subcategory: "Divertissement", description: "Passe journée festival", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Spectacle Cirque Soleil", price: 89.00, category: "leisure", subcategory: "Divertissement", description: "Billet spectacle", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Musée beaux-arts", price: 12.00, category: "leisure", subcategory: "Divertissement", description: "Entrée musée", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Escape room", price: 28.00, category: "leisure", subcategory: "Divertissement", description: "Jeu évasion 1 personne", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Karaoké 2h", price: 15.00, category: "leisure", subcategory: "Divertissement", description: "Location salle karaoké", isEssential: false, isTaxable: true },
        
        // Loisirs Jeux - TAXÉS
        { id: randomUUID(), name: "Jeu vidéo PS5/Xbox", price: 89.99, category: "leisure", subcategory: "Jeux", description: "Jeu AAA nouvelle sortie", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Jeu vidéo indie", price: 29.99, category: "leisure", subcategory: "Jeux", description: "Jeu indépendant Steam", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "PlayStation Plus an", price: 79.99, category: "leisure", subcategory: "Jeux", description: "Abonnement PS+ annuel", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Xbox Game Pass", price: 16.99, category: "leisure", subcategory: "Jeux", description: "Abonnement mensuel", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Jeu de société Catan", price: 54.99, category: "leisure", subcategory: "Jeux", description: "Jeu stratégie populaire", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Jeu cartes Uno", price: 9.99, category: "leisure", subcategory: "Jeux", description: "Jeu de cartes familial", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Casse-tête 1000 pièces", price: 19.99, category: "leisure", subcategory: "Jeux", description: "Puzzle adulte", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Bowling 2 parties", price: 18.00, category: "leisure", subcategory: "Jeux", description: "Session bowling", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Arcade 20 jetons", price: 15.00, category: "leisure", subcategory: "Jeux", description: "Jetons salle arcade", isEssential: false, isTaxable: true },
        
        // Loisirs Sport - TAXÉS
        { id: randomUUID(), name: "Gym mensuel", price: 39.99, category: "leisure", subcategory: "Sport", description: "Abonnement centre fitness", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Piscine municipale", price: 6.50, category: "leisure", subcategory: "Sport", description: "Entrée baignade libre", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Patinoire entrée", price: 5.00, category: "leisure", subcategory: "Sport", description: "Patinage libre 2h", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Location patins", price: 8.00, category: "leisure", subcategory: "Sport", description: "Patins hockey/artistique", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Ski Tremblant jour", price: 119.00, category: "leisure", subcategory: "Sport", description: "Billet ski journée", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Location skis", price: 49.00, category: "leisure", subcategory: "Sport", description: "Équipement ski journée", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Yoga cours drop-in", price: 18.00, category: "leisure", subcategory: "Sport", description: "Un cours de yoga", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Tennis court 1h", price: 20.00, category: "leisure", subcategory: "Sport", description: "Location terrain tennis", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Golf 18 trous", price: 65.00, category: "leisure", subcategory: "Sport", description: "Partie golf complète", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Escalade session", price: 22.00, category: "leisure", subcategory: "Sport", description: "Mur escalade 3h", isEssential: false, isTaxable: true },
        
        // Loisirs Restauration - TAXÉS
        { id: randomUUID(), name: "Café Starbucks", price: 5.99, category: "leisure", subcategory: "Restauration", description: "Grand latte signature", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Café Tim Hortons", price: 2.49, category: "leisure", subcategory: "Restauration", description: "Café moyen régulier", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Boba tea", price: 7.99, category: "leisure", subcategory: "Restauration", description: "Thé aux perles", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Smoothie Jugo Juice", price: 8.49, category: "leisure", subcategory: "Restauration", description: "Smoothie fruits frais", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "McDonald's combo", price: 12.99, category: "leisure", subcategory: "Restauration", description: "Repas Big Mac combo", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Subway 6 pouces", price: 8.99, category: "leisure", subcategory: "Restauration", description: "Sous-marin du jour", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Pizza slice", price: 4.50, category: "leisure", subcategory: "Restauration", description: "Pointe pizza fromage", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Poutine La Banquise", price: 11.99, category: "leisure", subcategory: "Restauration", description: "Poutine classique", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Sushi plateau", price: 18.99, category: "leisure", subcategory: "Restauration", description: "Assortiment 12 morceaux", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Restaurant brunch", price: 25.00, category: "leisure", subcategory: "Restauration", description: "Brunch week-end", isEssential: false, isTaxable: true },
        
        // Loisirs Culture - TAXÉS
        { id: randomUUID(), name: "Roman poche", price: 12.99, category: "leisure", subcategory: "Culture", description: "Livre format poche", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "BD/Manga", price: 14.99, category: "leisure", subcategory: "Culture", description: "Bande dessinée/manga", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Livre grand format", price: 29.99, category: "leisure", subcategory: "Culture", description: "Nouveau roman couverture rigide", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Magazine mensuel", price: 8.99, category: "leisure", subcategory: "Culture", description: "Revue spécialisée", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Vinyle album", price: 34.99, category: "leisure", subcategory: "Culture", description: "Album vinyle collector", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Cours dessin", price: 35.00, category: "leisure", subcategory: "Culture", description: "Atelier art 2h", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Cours musique", price: 45.00, category: "leisure", subcategory: "Culture", description: "Leçon instrument 1h", isEssential: false, isTaxable: true },
        { id: randomUUID(), name: "Théâtre billet", price: 55.00, category: "leisure", subcategory: "Culture", description: "Spectacle théâtre local", isEssential: false, isTaxable: true },
      ];
      defaultItems.forEach(item => this.catalogItems.set(item.id, item));
      this.save();
    }
  }

  async createClass(input: CreateClass): Promise<Class> {
    const id = randomUUID();
    const classData: Class = {
      id,
      code: input.code.toUpperCase(),
      teacherName: input.teacherName,
      mode: "predefined",
      createdAt: new Date(),
      expenseAmounts: {
        "Loyer": 15, "Internet": 5, "Téléphone": 3, "Hydro": 8,
        "Assurance Voiture": 10, "Assurance Maison": 7, "Essence": 12,
        "Nourriture": 20, "Sortie": 5,
      },
    };
    this.classes.set(id, classData);
    this.save();
    return classData;
  }

  async getStudentByNameAndClass(name: string, classId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.name.toLowerCase() === name.toLowerCase() && s.classId === classId);
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    return Array.from(this.classes.values()).find(c => c.code === code.toUpperCase());
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassStudents(classId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.classId === classId);
  }

  async updateClassExpenseAmounts(classId: string, amounts: Map<string, number>): Promise<Class | undefined> {
    const classData = this.classes.get(classId);
    if (!classData) return undefined;

    const updated = {
      ...classData,
      expenseAmounts: Object.fromEntries(amounts),
    };
    this.classes.set(classId, updated);

    const classStudents = await this.getClassStudents(classId);
    for (const student of classStudents) {
      for (const [expenseId, expense] of this.fixedExpenses.entries()) {
        if (expense.studentId === student.id) {
          const newAmount = amounts.get(expense.category);
          if (newAmount !== undefined) {
            this.fixedExpenses.set(expenseId, { ...expense, amount: newAmount });
          }
        }
      }
    }

    this.save();
    return updated;
  }

  async updateClassPredefinedBudget(classId: string, predefinedBudget: number): Promise<Class | undefined> {
    const classData = this.classes.get(classId);
    if (!classData) return undefined;
    const updated = { ...classData, predefinedBudget };
    this.classes.set(classId, updated);
    this.save();
    return updated;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...input, id, spent: 0, savings: 0, createdAt: new Date(), budgetHistory: [{ budget: input.budget, date: new Date() }], scenario: input.scenario, customExpenses: input.customExpenses, monthlyBudget: input.monthlyBudget || input.budget };
    this.students.set(id, student);

    const classData = await this.getClass(input.classId);
    let amounts = classData?.expenseAmounts || this.getDefaultAmounts();
    
    // Si l'élève a un budget personnalisé, adapter les dépenses proportionnellement
    if (input.customExpenses) {
      amounts = input.customExpenses;
    }

    const fixedExpensesList = [
      { name: "Loyer", amount: amounts["Loyer"] || 15 },
      { name: "Internet", amount: amounts["Internet"] || 5 },
      { name: "Téléphone", amount: amounts["Téléphone"] || 3 },
      { name: "Hydro", amount: amounts["Hydro"] || 8 },
      { name: "Assurance Voiture", amount: amounts["Assurance Voiture"] || 10 },
      { name: "Assurance Maison", amount: amounts["Assurance Maison"] || 7 },
      { name: "Essence", amount: amounts["Essence"] || 12 },
      { name: "Nourriture", amount: amounts["Nourriture"] || 20 },
      { name: "Sortie", amount: amounts["Sortie"] || 5 },
    ];

    for (const expense of fixedExpensesList) {
      const expenseId = randomUUID();
      this.fixedExpenses.set(expenseId, {
        id: expenseId,
        studentId: id,
        category: expense.name,
        amount: expense.amount,
        isPaid: false,
        dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    this.save();
    return student;
  }

  async updateStudentBudget(id: string, budget: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, budget };
    this.students.set(id, updated);
    this.save();
    return updated;
  }

  async updateStudentBudgetWithHistory(id: string, budget: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const budgetHistory = student.budgetHistory || [];
    budgetHistory.push({ budget, date: new Date() });
    const updated = { ...student, budget, spent: 0, savings: 0, budgetHistory, monthlyBudget: budget };
    this.students.set(id, updated);
    this.save();
    return updated;
  }

  async clearStudentBudgetHistory(id: string): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, budgetHistory: [] };
    this.students.set(id, updated);
    this.save();
    return updated;
  }

  async resetStudentBudget(id: string, newBudget: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { 
      ...student, 
      budget: newBudget, 
      spent: 0, 
      savings: 0,
      budgetHistory: [{ budget: newBudget, date: new Date() }]
    };
    this.students.set(id, updated);
    this.save();
    return updated;
  }

  async fullResetStudent(id: string): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const originalBudget = student.monthlyBudget || student.budget;
    const updated: Student = {
      ...student,
      budget: originalBudget,
      spent: 0,
      savings: 0,
      currentMonth: 1,
      monthlyBudget: originalBudget,
      budgetHistory: [{ budget: originalBudget, date: new Date() }],
    };
    this.students.set(id, updated);
    // Delete all catalog purchases
    for (const [expId, exp] of this.expenses.entries()) {
      if ((exp as any).studentId === id) this.expenses.delete(expId);
    }
    // Delete and recreate fixed expenses
    const classData = await this.getClass(student.classId);
    const amounts = student.customExpenses || classData?.expenseAmounts || this.getDefaultAmounts();
    for (const [fxId, fx] of this.fixedExpenses.entries()) {
      if ((fx as any).studentId === id) this.fixedExpenses.delete(fxId);
    }
    for (const [category, amount] of Object.entries(amounts)) {
      await this.createFixedExpense(id, category, amount as number);
    }
    // Delete badges so they can be re-earned from scratch
    if (this.badges) {
      for (const [bId, b] of this.badges.entries()) {
        if ((b as any).studentId === id) this.badges.delete(bId);
      }
    }
    this.save();
    return updated;
  }

  async updateStudentBudgetAndSpent(id: string, budget: number, spent: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, budget, spent };
    this.students.set(id, updated);
    this.save();
    return updated;
  }

  async updateStudentSavings(id: string, savings: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, savings };
    this.students.set(id, updated);
    this.save();
    return updated;
  }

  async updateStudentCustomExpenses(id: string, customExpenses: Record<string, number>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, customExpenses };
    this.students.set(id, updated);
    this.save();
    return updated;
  }

  private getDefaultAmounts(): Record<string, number> {
    return {
      "Loyer": 15, "Internet": 5, "Téléphone": 3, "Hydro": 8,
      "Assurance Voiture": 10, "Assurance Maison": 7, "Essence": 12,
      "Nourriture": 20, "Sortie": 5,
    };
  }

  async getCatalogItems(category?: string): Promise<CatalogItem[]> {
    const items = Array.from(this.catalogItems.values());
    return category ? items.filter(item => item.category === category) : items;
  }

  async getCatalogItem(id: string): Promise<CatalogItem | undefined> {
    return this.catalogItems.get(id);
  }

  async createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem> {
    const id = randomUUID();
    const catalogItem: CatalogItem = { ...item, id };
    this.catalogItems.set(id, catalogItem);
    this.save();
    return catalogItem;
  }

  async addExpense(expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const newExpense: Expense = { ...expense, id, timestamp: new Date() };
    this.expenses.set(id, newExpense);

    // Only add to spent - do NOT reduce budget (that would double-count)
    // Budget stays fixed, spent increases, remaining = budget - spent
    const student = await this.getStudent(expense.studentId);
    if (student) {
      const newSpent = (student.spent || 0) + expense.amount;
      // Keep budget the same - only update spent
      await this.updateStudentBudgetAndSpent(expense.studentId, student.budget, newSpent);
    }

    this.save();
    return newExpense;
  }

  async getStudentExpenses(studentId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(e => e.studentId === studentId);
  }

  async getAllExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async deleteExpense(id: string): Promise<boolean> {
    const expense = this.expenses.get(id);
    if (!expense) return false;
    
    // Refund the student - only reduce spent, don't change budget
    // Budget stays fixed, spent decreases, remaining = budget - spent
    const student = await this.getStudent(expense.studentId);
    if (student) {
      const newSpent = Math.max(0, (student.spent || 0) - expense.amount);
      // Keep budget the same - only update spent
      await this.updateStudentBudgetAndSpent(expense.studentId, student.budget, newSpent);
    }
    
    this.expenses.delete(id);
    this.save();
    return true;
  }

  async deleteStudentExpenses(studentId: string): Promise<void> {
    const studentExpenses = await this.getStudentExpenses(studentId);
    
    for (const expense of studentExpenses) {
      this.expenses.delete(expense.id);
    }
    
    // Refund the student - only reset spent to 0, don't change budget
    const student = await this.getStudent(studentId);
    if (student) {
      // Keep budget the same - only reset spent to 0
      await this.updateStudentBudgetAndSpent(studentId, student.budget, 0);
    }
    
    this.save();
  }

  async getFixedExpenses(studentId: string): Promise<FixedExpense[]> {
    return Array.from(this.fixedExpenses.values()).filter(e => e.studentId === studentId);
  }

  async createFixedExpense(studentId: string, category: string, amount: number): Promise<FixedExpense> {
    const id = randomUUID();
    const expense: FixedExpense = { id, studentId, category, amount, isPaid: false, dueDate: new Date() };
    this.fixedExpenses.set(id, expense);
    this.save();
    return expense;
  }

  async deleteStudentFixedExpenses(studentId: string): Promise<void> {
    for (const [id, expense] of this.fixedExpenses) {
      if (expense.studentId === studentId) {
        this.fixedExpenses.delete(id);
      }
    }
    this.save();
  }

  async payFixedExpense(id: string): Promise<FixedExpense | undefined> {
    const expense = this.fixedExpenses.get(id);
    if (!expense) return undefined;
    const updated = { ...expense, isPaid: true };
    this.fixedExpenses.set(id, updated);
    this.save();
    return updated;
  }

  async updateFixedExpenseAmount(expenseId: string, amount: number): Promise<FixedExpense | undefined> {
    const expense = this.fixedExpenses.get(expenseId);
    if (!expense) return undefined;
    const updated = { ...expense, amount };
    this.fixedExpenses.set(expenseId, updated);
    this.save();
    return updated;
  }

  async getDefaultExpenseAmounts(): Promise<Map<string, number>> {
    return new Map(Object.entries(this.getDefaultAmounts()));
  }

  async setDefaultExpenseAmounts(_amounts: Map<string, number>): Promise<void> {}

  async updateAllStudentExpenseAmounts(amounts: Map<string, number>): Promise<void> {
    for (const [expenseId, expense] of this.fixedExpenses.entries()) {
      const newAmount = amounts.get(expense.category);
      if (newAmount !== undefined) {
        this.fixedExpenses.set(expenseId, { ...expense, amount: newAmount });
      }
    }
    this.save();
  }

  async createBonusExpense(input: CreateBonusExpense, classId: string): Promise<BonusExpense> {
    const id = randomUUID();
    const bonus: BonusExpense = { id, ...input, classId, createdAt: new Date(), isPaid: false };
    this.bonusExpenses.set(id, bonus);
    // Don't deduct from budget when creating - only when paying
    this.save();
    return bonus;
  }

  async getStudentBonusExpenses(studentId: string): Promise<BonusExpense[]> {
    return Array.from(this.bonusExpenses.values()).filter(b => b.studentId === studentId);
  }

  async payBonusExpense(id: string): Promise<BonusExpense | undefined> {
    const bonus = this.bonusExpenses.get(id);
    if (!bonus) return undefined;
    const updated = { ...bonus, isPaid: true };
    this.bonusExpenses.set(id, updated);
    // Note: The route handler will update spent when this is called
    this.save();
    return updated;
  }

  async deleteBonusExpense(id: string): Promise<boolean> {
    const bonus = this.bonusExpenses.get(id);
    if (!bonus) return false;
    
    // Refund the student only if the bonus was paid
    // Reduce spent, don't add to budget
    if (bonus.isPaid) {
      const student = await this.getStudent(bonus.studentId);
      if (student) {
        const newSpent = Math.max(0, (student.spent || 0) - bonus.amount);
        await this.updateStudentBudgetAndSpent(bonus.studentId, student.budget, newSpent);
      }
    }
    
    this.bonusExpenses.delete(id);
    this.save();
    return true;
  }

  async deleteClassBonusExpenses(classId: string): Promise<void> {
    for (const [id, bonus] of this.bonusExpenses.entries()) {
      if (bonus.classId === classId) {
        this.bonusExpenses.delete(id);
      }
    }
    this.save();
  }

  async createChallenge(input: CreateChallenge): Promise<Challenge> {
    const id = randomUUID();
    const challenge: Challenge = {
      id,
      ...input,
      completed: false,
      createdAt: new Date(),
    };
    this.challenges.set(id, challenge);
    this.save();
    return challenge;
  }

  async getStudentChallenges(studentId: string): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(c => c.studentId === studentId);
  }

  async deleteStudentChallenges(studentId: string): Promise<void> {
    for (const [id, challenge] of this.challenges.entries()) {
      if (challenge.studentId === studentId) {
        this.challenges.delete(id);
      }
    }
    this.save();
  }

  async completeChallenge(id: string): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(id);
    if (!challenge) return undefined;
    const updated = { ...challenge, completed: true };
    this.challenges.set(id, updated);
    this.save();
    return updated;
  }

  async createCustomChallenge(input: CreateCustomChallenge): Promise<CustomChallenge> {
    const id = randomUUID();
    const challenge: CustomChallenge = {
      ...input,
      id,
      teacherId: "system",
      createdAt: new Date(),
      completedBy: [],
    };
    this.customChallenges.set(id, challenge);
    this.save();
    return challenge;
  }

  async getClassCustomChallenges(classId: string): Promise<CustomChallenge[]> {
    return Array.from(this.customChallenges.values()).filter(c => c.classId === classId);
  }

  async completeCustomChallenge(id: string, studentId: string): Promise<CustomChallenge | undefined> {
    const challenge = this.customChallenges.get(id);
    if (!challenge) return undefined;
    if (!challenge.completedBy.includes(studentId)) {
      challenge.completedBy.push(studentId);
    }
    this.customChallenges.set(id, challenge);
    this.save();
    return challenge;
  }

  async createTeacherMessage(input: CreateTeacherMessage): Promise<TeacherMessage> {
    const id = randomUUID();
    const message: TeacherMessage = {
      ...input,
      id,
      teacherId: "system",
      timestamp: new Date(),
    };
    this.teacherMessages.set(id, message);
    this.save();
    return message;
  }

  async getClassMessages(classId: string): Promise<TeacherMessage[]> {
    return Array.from(this.teacherMessages.values()).filter(m => m.classId === classId);
  }

  async getStudentMessages(studentId: string, classId: string): Promise<TeacherMessage[]> {
    return Array.from(this.teacherMessages.values()).filter(m =>
      m.classId === classId && (!m.studentId || m.studentId === studentId)
    );
  }

  async createSurpriseEvent(input: CreateSurpriseEvent): Promise<SurpriseEvent> {
    const id = randomUUID();
    const event: SurpriseEvent = {
      ...input,
      id,
      createdAt: new Date(),
    };
    this.surpriseEvents.set(id, event);
    this.save();
    return event;
  }

  async getSurpriseEvent(eventId: string): Promise<SurpriseEvent | undefined> {
    return this.surpriseEvents.get(eventId);
  }

  async getClassSurpriseEvents(classId: string): Promise<SurpriseEvent[]> {
    return Array.from(this.surpriseEvents.values()).filter(e => e.classId === classId && !e.appliedAt);
  }

  async applyStudentSurpriseEvent(eventId: string, studentId: string): Promise<SurpriseEvent | undefined> {
    const event = this.surpriseEvents.get(eventId);
    if (!event) return undefined;
    const updated = { ...event, appliedAt: new Date(), studentId };
    this.surpriseEvents.set(eventId, updated);
    this.save();
    return updated;
  }

  async createSnapshot(studentId: string, label: string): Promise<BudgetSnapshot> {
    const student = await this.getStudent(studentId);
    if (!student) throw new Error("Étudiant non trouvé");

    const existingSnapshots = await this.getStudentSnapshots(studentId);
    if (existingSnapshots.length >= 3) {
      const oldest = existingSnapshots.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];
      this.snapshots.delete(oldest.id);
    }

    const expenses = Array.from(this.expenses.values()).filter(e => e.studentId === studentId);
    const fixedExpenses = Array.from(this.fixedExpenses.values()).filter(e => e.studentId === studentId);
    const bonusExpenses = Array.from(this.bonusExpenses.values()).filter(e => e.studentId === studentId);
    const challenges = Array.from(this.challenges.values()).filter(c => c.studentId === studentId);

    const id = randomUUID();
    const snapshot: BudgetSnapshot = {
      id,
      studentId,
      label,
      createdAt: new Date(),
      studentState: {
        budget: student.budget,
        spent: student.spent,
        savings: student.savings,
      },
      expenses: JSON.parse(JSON.stringify(expenses)),
      fixedExpenses: JSON.parse(JSON.stringify(fixedExpenses)),
      bonusExpenses: JSON.parse(JSON.stringify(bonusExpenses)),
      challenges: JSON.parse(JSON.stringify(challenges)),
    };
    this.snapshots.set(id, snapshot);
    this.save();
    return snapshot;
  }

  async getStudentSnapshots(studentId: string): Promise<BudgetSnapshot[]> {
    return Array.from(this.snapshots.values())
      .filter(s => s.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async restoreSnapshot(snapshotId: string): Promise<Student | undefined> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return undefined;

    const student = await this.getStudent(snapshot.studentId);
    if (!student) return undefined;

    const updatedStudent = {
      ...student,
      budget: snapshot.studentState.budget,
      spent: snapshot.studentState.spent,
      savings: snapshot.studentState.savings,
    };
    this.students.set(student.id, updatedStudent);

    for (const [id, exp] of this.expenses.entries()) {
      if (exp.studentId === snapshot.studentId) {
        this.expenses.delete(id);
      }
    }
    for (const exp of snapshot.expenses) {
      this.expenses.set(exp.id, { ...exp, timestamp: new Date(exp.timestamp) });
    }

    for (const [id, fe] of this.fixedExpenses.entries()) {
      if (fe.studentId === snapshot.studentId) {
        this.fixedExpenses.delete(id);
      }
    }
    for (const fe of snapshot.fixedExpenses) {
      this.fixedExpenses.set(fe.id, { ...fe, dueDate: new Date(fe.dueDate) });
    }

    for (const [id, be] of this.bonusExpenses.entries()) {
      if (be.studentId === snapshot.studentId) {
        this.bonusExpenses.delete(id);
      }
    }
    for (const be of snapshot.bonusExpenses) {
      this.bonusExpenses.set(be.id, { ...be, createdAt: new Date(be.createdAt) });
    }

    for (const [id, ch] of this.challenges.entries()) {
      if (ch.studentId === snapshot.studentId) {
        this.challenges.delete(id);
      }
    }
    for (const ch of snapshot.challenges) {
      this.challenges.set(ch.id, { ...ch, createdAt: new Date(ch.createdAt) });
    }

    this.save();
    return updatedStudent;
  }

  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    const result = this.snapshots.delete(snapshotId);
    if (result) this.save();
    return result;
  }

  async startNewMonth(studentId: string): Promise<Student | undefined> {
    const student = this.students.get(studentId);
    if (!student) return undefined;

    const classData = await this.getClass(student.classId);
    const classDefaultBudget = classData?.predefinedBudget || 1500;
    const monthlyBudget = student.monthlyBudget || student.budget || classDefaultBudget;
    const previousMonth = student.currentMonth || 1;
    const newMonth = previousMonth + 1;
    
    const remainingBudget = Math.max(0, student.budget);
    const totalSavings = student.savings + remainingBudget;
    
    const updatedStudent: Student = {
      ...student,
      budget: monthlyBudget,
      spent: 0,
      savings: totalSavings,
      currentMonth: newMonth,
      monthlyBudget,
      budgetHistory: [
        ...(student.budgetHistory || []),
        { 
          budget: student.budget, 
          date: new Date(),
        }
      ],
    };
    
    this.students.set(studentId, updatedStudent);
    
    await this.resetFixedExpensesForNewMonth(studentId);
    
    this.save();
    return updatedStudent;
  }

  async resetFixedExpensesForNewMonth(studentId: string): Promise<void> {
    for (const [id, expense] of this.fixedExpenses.entries()) {
      if (expense.studentId === studentId) {
        this.fixedExpenses.set(id, {
          ...expense,
          isPaid: false,
          dueDate: new Date(),
        });
      }
    }
    this.save();
  }

  // Gamification - Badges
  async awardBadge(studentId: string, type: Badge["type"], tier: Badge["tier"] = "bronze"): Promise<Badge> {
    const existingBadge = await this.getStudentBadgeByType(studentId, type);
    if (existingBadge) {
      // Update to higher tier if needed
      const updatedBadge: Badge = { ...existingBadge, tier, earnedAt: new Date() };
      this.badges.set(existingBadge.id, updatedBadge);
      this.save();
      return updatedBadge;
    }
    const id = randomUUID();
    const badge: Badge = {
      id,
      type,
      tier,
      studentId,
      earnedAt: new Date(),
    };
    this.badges.set(id, badge);
    this.save();
    return badge;
  }

  async getStudentBadges(studentId: string): Promise<Badge[]> {
    return Array.from(this.badges.values()).filter(b => b.studentId === studentId);
  }

  async hasStudentBadge(studentId: string, type: Badge["type"]): Promise<boolean> {
    return Array.from(this.badges.values()).some(b => b.studentId === studentId && b.type === type);
  }

  async getStudentBadgeByType(studentId: string, type: Badge["type"]): Promise<Badge | undefined> {
    return Array.from(this.badges.values()).find(b => b.studentId === studentId && b.type === type);
  }

  // Gamification - Savings Goals
  async createSavingsGoal(input: CreateSavingsGoal): Promise<SavingsGoal> {
    const id = randomUUID();
    const goal: SavingsGoal = {
      id,
      studentId: input.studentId,
      title: input.title,
      targetAmount: input.targetAmount,
      currentAmount: 0,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      completed: false,
      createdAt: new Date(),
    };
    this.savingsGoals.set(id, goal);
    this.save();
    return goal;
  }

  async getStudentSavingsGoals(studentId: string): Promise<SavingsGoal[]> {
    return Array.from(this.savingsGoals.values()).filter(g => g.studentId === studentId);
  }

  async updateSavingsGoalProgress(goalId: string, currentAmount: number): Promise<SavingsGoal | undefined> {
    const goal = this.savingsGoals.get(goalId);
    if (!goal) return undefined;
    const updated = { ...goal, currentAmount };
    if (currentAmount >= goal.targetAmount) {
      updated.completed = true;
    }
    this.savingsGoals.set(goalId, updated);
    this.save();
    return updated;
  }

  async completeSavingsGoal(goalId: string): Promise<SavingsGoal | undefined> {
    const goal = this.savingsGoals.get(goalId);
    if (!goal) return undefined;
    const updated = { ...goal, completed: true, currentAmount: goal.targetAmount };
    this.savingsGoals.set(goalId, updated);
    this.save();
    return updated;
  }

  async deleteSavingsGoal(goalId: string): Promise<boolean> {
    const result = this.savingsGoals.delete(goalId);
    if (result) this.save();
    return result;
  }

  // Gamification - Class Challenges
  async createClassChallenge(input: CreateClassChallenge): Promise<ClassChallenge> {
    const id = randomUUID();
    const challenge: ClassChallenge = {
      id,
      classId: input.classId,
      title: input.title,
      description: input.description,
      type: input.type,
      targetValue: input.targetValue,
      reward: input.reward,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      createdAt: new Date(),
      completedBy: [],
    };
    this.classChallenges.set(id, challenge);
    this.save();
    return challenge;
  }

  async getClassChallenges(classId: string): Promise<ClassChallenge[]> {
    return Array.from(this.classChallenges.values()).filter(c => c.classId === classId);
  }

  async completeClassChallenge(challengeId: string, studentId: string): Promise<ClassChallenge | undefined> {
    const challenge = this.classChallenges.get(challengeId);
    if (!challenge) return undefined;
    if (!challenge.completedBy.includes(studentId)) {
      challenge.completedBy.push(studentId);
    }
    this.classChallenges.set(challengeId, challenge);
    this.save();
    return challenge;
  }

  async deleteClassChallenge(challengeId: string): Promise<boolean> {
    const result = this.classChallenges.delete(challengeId);
    if (result) this.save();
    return result;
  }

  // Leaderboard
  async getClassLeaderboard(classId: string): Promise<Array<{studentId: string; name: string; savings: number; badgeCount: number; challengesCompleted: number}>> {
    const students = await this.getClassStudents(classId);
    const challenges = await this.getClassChallenges(classId);
    
    const leaderboard = await Promise.all(students.map(async (student) => {
      const badges = await this.getStudentBadges(student.id);
      const challengesCompleted = challenges.filter(c => c.completedBy.includes(student.id)).length;
      
      return {
        studentId: student.id,
        name: student.name,
        savings: student.savings,
        badgeCount: badges.length,
        challengesCompleted,
      };
    }));
    
    // Sort by savings (descending), then by badges, then by challenges
    return leaderboard.sort((a, b) => {
      if (b.savings !== a.savings) return b.savings - a.savings;
      if (b.badgeCount !== a.badgeCount) return b.badgeCount - a.badgeCount;
      return b.challengesCompleted - a.challengesCompleted;
    });
  }
}
