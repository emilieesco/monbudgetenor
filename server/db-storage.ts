import postgres from "postgres";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";
import type {
  Student, CatalogItem, Expense, FixedExpense, InsertStudent, InsertCatalogItem,
  InsertExpense, Class, CreateClass, BonusExpense, CreateBonusExpense, Challenge,
  CreateChallenge, CustomChallenge, CreateCustomChallenge, TeacherMessage,
  CreateTeacherMessage, SurpriseEvent, CreateSurpriseEvent, BudgetSnapshot,
  Badge, SavingsGoal, CreateSavingsGoal, ClassChallenge, CreateClassChallenge,
  TeacherInvite
} from "@shared/schema";

const DEFAULT_EXPENSE_AMOUNTS: Record<string, number> = {
  "Loyer": 15, "Internet": 5, "Téléphone": 3, "Hydro": 8,
  "Assurance Voiture": 10, "Assurance Maison": 7, "Essence": 12,
  "Nourriture": 20, "Sortie": 5,
};

function parseJson<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val as T;
}

function toClass(row: any): Class {
  return {
    id: row.id,
    code: row.code,
    teacherName: row.teacher_name,
    createdAt: new Date(row.created_at),
    expenseAmounts: parseJson(row.expense_amounts, {}),
    mode: row.mode ?? "predefined",
    predefinedBudget: row.predefined_budget != null ? Number(row.predefined_budget) : undefined,
  };
}

function toStudent(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    classId: row.class_id,
    budget: Number(row.budget),
    spent: Number(row.spent),
    savings: Number(row.savings),
    createdAt: new Date(row.created_at),
    customExpenses: row.custom_expenses ? parseJson(row.custom_expenses, undefined) : undefined,
    scenario: row.scenario ?? undefined,
    budgetHistory: parseJson(row.budget_history, []),
    currentMonth: row.current_month ?? 1,
    monthlyBudget: row.monthly_budget != null ? Number(row.monthly_budget) : undefined,
  };
}

function toCatalogItem(row: any): CatalogItem {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    description: row.description,
    isEssential: row.is_essential,
    isTaxable: row.is_taxable,
  };
}

function toExpense(row: any): Expense {
  return {
    id: row.id,
    studentId: row.student_id,
    itemId: row.item_id,
    amount: Number(row.amount),
    category: row.category,
    isEssential: row.is_essential,
    timestamp: new Date(row.timestamp),
    feedback: row.feedback ?? "success",
    message: row.message ?? "",
  };
}

function toFixedExpense(row: any): FixedExpense {
  return {
    id: row.id,
    studentId: row.student_id,
    category: row.category,
    amount: Number(row.amount),
    isPaid: row.is_paid,
    dueDate: new Date(row.due_date),
    isCustom: row.is_custom ?? false,
  };
}

function toBonusExpense(row: any): BonusExpense {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    title: row.title,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    createdAt: new Date(row.created_at),
    isPaid: row.is_paid,
  };
}

function toChallenge(row: any): Challenge {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    description: row.description,
    type: row.type,
    targetValue: Number(row.target_value),
    completed: row.completed,
    createdAt: new Date(row.created_at),
  };
}

function toCustomChallenge(row: any): CustomChallenge {
  return {
    id: row.id,
    classId: row.class_id,
    teacherId: row.teacher_id,
    title: row.title,
    description: row.description,
    type: row.type,
    targetValue: Number(row.target_value),
    createdAt: new Date(row.created_at),
    completedBy: parseJson(row.completed_by, []),
  };
}

function toTeacherMessage(row: any): TeacherMessage {
  return {
    id: row.id,
    classId: row.class_id,
    studentId: row.student_id ?? undefined,
    teacherId: row.teacher_id,
    content: row.content,
    type: row.type,
    timestamp: new Date(row.timestamp),
  };
}

function toSurpriseEvent(row: any): SurpriseEvent {
  return {
    id: row.id,
    classId: row.class_id,
    studentId: row.student_id ?? undefined,
    type: row.type,
    title: row.title,
    description: row.description,
    amount: Number(row.amount),
    createdAt: new Date(row.created_at),
    appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
  };
}

function toSnapshot(row: any): BudgetSnapshot {
  return {
    id: row.id,
    studentId: row.student_id,
    label: row.label,
    createdAt: new Date(row.created_at),
    studentState: parseJson(row.student_state, {}),
    expenses: parseJson(row.expenses, []),
    fixedExpenses: parseJson(row.fixed_expenses, []),
    bonusExpenses: parseJson(row.bonus_expenses, []),
    challenges: parseJson(row.challenges, []),
  };
}

function toBadge(row: any): Badge {
  return {
    id: row.id,
    type: row.type,
    tier: row.tier,
    studentId: row.student_id,
    earnedAt: new Date(row.earned_at),
  };
}

function toSavingsGoal(row: any): SavingsGoal {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline ? new Date(row.deadline) : undefined,
    completed: row.completed,
    createdAt: new Date(row.created_at),
  };
}

function toClassChallenge(row: any): ClassChallenge {
  return {
    id: row.id,
    classId: row.class_id,
    title: row.title,
    description: row.description,
    type: row.type,
    targetValue: Number(row.target_value),
    reward: row.reward ?? undefined,
    deadline: row.deadline ? new Date(row.deadline) : undefined,
    createdAt: new Date(row.created_at),
    completedBy: row.completed_by ?? [],
  };
}

export class DatabaseStorage implements IStorage {
  private sql: ReturnType<typeof postgres>;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, { ssl: "require" });
  }

  async initialize() {
    await this.createTables();
    await this.deduplicateCatalog();
    await this.seedCatalogIfEmpty();
    console.log("Database storage initialized");
  }

  private async deduplicateCatalog() {
    // Remove items with duplicate-sounding names — keep the one with the longest name (more accents)
    // Strategy: find items whose names are duplicates when normalized (remove accents)
    const rows = await this.sql`SELECT id, name FROM catalog_items ORDER BY name`;
    const seen = new Map<string, { id: string; name: string }>();
    const toDelete: string[] = [];
    for (const row of rows) {
      const normalized = (row.name as string)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (seen.has(normalized)) {
        const existing = seen.get(normalized)!;
        // Keep the one with more accents (longer after normalization difference)
        const existingAccents = (existing.name as string).replace(/[a-zA-Z0-9\s]/g, "").length;
        const newAccents = (row.name as string).replace(/[a-zA-Z0-9\s]/g, "").length;
        if (newAccents >= existingAccents) {
          toDelete.push(existing.id);
          seen.set(normalized, row as { id: string; name: string });
        } else {
          toDelete.push(row.id as string);
        }
      } else {
        seen.set(normalized, row as { id: string; name: string });
      }
    }
    if (toDelete.length > 0) {
      await this.sql`DELETE FROM catalog_items WHERE id = ANY(${toDelete})`;
      console.log(`Removed ${toDelete.length} duplicate catalog items`);
    }
  }

  private async createTables() {
    await this.sql`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        teacher_name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expense_amounts JSONB DEFAULT '{}',
        mode TEXT DEFAULT 'predefined',
        predefined_budget NUMERIC
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        class_id TEXT NOT NULL REFERENCES classes(id),
        budget NUMERIC NOT NULL,
        spent NUMERIC DEFAULT 0,
        savings NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        custom_expenses JSONB,
        scenario TEXT,
        budget_history JSONB DEFAULT '[]',
        current_month INTEGER DEFAULT 1,
        monthly_budget NUMERIC
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS catalog_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        description TEXT NOT NULL,
        is_essential BOOLEAN NOT NULL,
        is_taxable BOOLEAN NOT NULL
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id),
        item_id TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        category TEXT NOT NULL,
        is_essential BOOLEAN NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        feedback TEXT DEFAULT 'success',
        message TEXT DEFAULT ''
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS fixed_expenses (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id),
        category TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        is_paid BOOLEAN DEFAULT FALSE,
        due_date TIMESTAMPTZ DEFAULT NOW(),
        is_custom BOOLEAN DEFAULT FALSE
      )
    `;
    await this.sql`ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE`;
    await this.sql`
      CREATE TABLE IF NOT EXISTS bonus_expenses (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id),
        class_id TEXT NOT NULL REFERENCES classes(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        category TEXT DEFAULT 'other',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_paid BOOLEAN DEFAULT FALSE
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value NUMERIC NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS custom_challenges (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id),
        teacher_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value NUMERIC NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_by JSONB DEFAULT '[]'
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS teacher_messages (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id),
        student_id TEXT,
        teacher_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS surprise_events (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id),
        student_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        applied_at TIMESTAMPTZ
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS budget_snapshots (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id),
        label TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        student_state JSONB NOT NULL,
        expenses JSONB DEFAULT '[]',
        fixed_expenses JSONB DEFAULT '[]',
        bonus_expenses JSONB DEFAULT '[]',
        challenges JSONB DEFAULT '[]'
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tier TEXT NOT NULL,
        student_id TEXT NOT NULL REFERENCES students(id),
        earned_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id),
        title TEXT NOT NULL,
        target_amount NUMERIC NOT NULL,
        current_amount NUMERIC DEFAULT 0,
        deadline TIMESTAMPTZ,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS class_challenges (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value NUMERIC NOT NULL,
        reward TEXT,
        deadline TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_by JSONB DEFAULT '[]'
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS teacher_invites (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMPTZ
      )
    `;
  }

  private normalizeForComparison(name: string): string {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  private async seedCatalogIfEmpty() {
    const existingRows = await this.sql`SELECT name FROM catalog_items`;
    const existingNormalized = new Set(existingRows.map((r: any) => this.normalizeForComparison(r.name as string)));

    const allDefaultItems: CatalogItem[] = [
      // Produits laitiers
      { id: randomUUID(), name: "Lait 2% 2L", price: 4.99, category: "food", subcategory: "Produits Laitiers", description: "Lait partiellement écrémé", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Lait 3.25% 2L", price: 5.29, category: "food", subcategory: "Produits Laitiers", description: "Lait entier homogénéisé", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Yogourt nature 650g", price: 4.49, category: "food", subcategory: "Produits Laitiers", description: "Yogourt nature sans sucre", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Fromage cheddar 400g", price: 7.99, category: "food", subcategory: "Produits Laitiers", description: "Cheddar fort vieilli", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Beurre salé 454g", price: 5.99, category: "food", subcategory: "Produits Laitiers", description: "Beurre de laiterie", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Crème 35% 473ml", price: 4.29, category: "food", subcategory: "Produits Laitiers", description: "Crème à fouetter", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Mozzarella 340g", price: 6.49, category: "food", subcategory: "Produits Laitiers", description: "Fromage mozzarella", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Crème sure 500ml", price: 3.49, category: "food", subcategory: "Produits Laitiers", description: "Crème sure 14%", isEssential: false, isTaxable: false },
      // Viandes
      { id: randomUUID(), name: "Poulet entier 1.5kg", price: 12.99, category: "food", subcategory: "Viandes", description: "Poulet frais entier", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Oeufs gros calibre 12", price: 4.99, category: "food", subcategory: "Viandes", description: "Oeufs frais grade A", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Boeuf hache mi-maigre 450g", price: 7.99, category: "food", subcategory: "Viandes", description: "Boeuf hache frais", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Poitrines de poulet 900g", price: 15.99, category: "food", subcategory: "Viandes", description: "Poitrines desossees", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Cotelettes de porc 600g", price: 9.99, category: "food", subcategory: "Viandes", description: "Cotelettes avec os", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Bacon 375g", price: 6.99, category: "food", subcategory: "Viandes", description: "Bacon tranche", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Saumon filet 400g", price: 14.99, category: "food", subcategory: "Viandes", description: "Filet de saumon atlantique", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Crevettes 340g", price: 12.99, category: "food", subcategory: "Viandes", description: "Crevettes decortiquees", isEssential: false, isTaxable: false },
      // Fruits & Légumes
      { id: randomUUID(), name: "Bananes", price: 1.49, category: "food", subcategory: "Fruits & Légumes", description: "Bananes fraiches /lb", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Pommes Gala 3lb", price: 4.99, category: "food", subcategory: "Fruits & Légumes", description: "Pommes Gala en sac", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Oranges Navel 4lb", price: 6.99, category: "food", subcategory: "Fruits & Légumes", description: "Oranges juteuses", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Carottes 2lb", price: 2.49, category: "food", subcategory: "Fruits & Légumes", description: "Carottes fraiches", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Brocoli", price: 2.99, category: "food", subcategory: "Fruits & Légumes", description: "Brocoli frais", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Tomates grappe", price: 3.99, category: "food", subcategory: "Fruits & Légumes", description: "Tomates sur vigne /lb", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Laitue romaine", price: 2.99, category: "food", subcategory: "Fruits & Légumes", description: "Laitue fraiche", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Pommes de terre 10lb", price: 5.99, category: "food", subcategory: "Fruits & Légumes", description: "Pommes de terre russet", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Oignons 3lb", price: 3.49, category: "food", subcategory: "Fruits & Légumes", description: "Oignons jaunes", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Poivrons 3 couleurs", price: 4.99, category: "food", subcategory: "Fruits & Légumes", description: "Poivrons rouge, jaune, vert", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Epinards 142g", price: 3.49, category: "food", subcategory: "Fruits & Légumes", description: "Epinards frais en sac", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Champignons 227g", price: 2.99, category: "food", subcategory: "Fruits & Légumes", description: "Champignons blancs", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Concombre", price: 1.49, category: "food", subcategory: "Fruits & Légumes", description: "Concombre anglais", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Courgettes 2", price: 2.49, category: "food", subcategory: "Fruits & Légumes", description: "Courgettes vertes", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Mangues 2", price: 3.99, category: "food", subcategory: "Fruits & Légumes", description: "Mangues mures", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Fraises 454g", price: 4.99, category: "food", subcategory: "Fruits & Légumes", description: "Fraises fraiches", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Bleuets 170g", price: 3.99, category: "food", subcategory: "Fruits & Légumes", description: "Bleuets frais", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Raisins verts 2lb", price: 5.49, category: "food", subcategory: "Fruits & Légumes", description: "Raisins sans pepins", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Celeri", price: 2.49, category: "food", subcategory: "Fruits & Légumes", description: "Pied de celeri", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Ail 3 tetes", price: 2.99, category: "food", subcategory: "Fruits & Légumes", description: "Bulbes d'ail blanc", isEssential: true, isTaxable: false },
      // Conserves
      { id: randomUUID(), name: "Pates spaghetti 900g", price: 2.49, category: "food", subcategory: "Conserves", description: "Spaghetti Catelli", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Riz blanc 2kg", price: 4.99, category: "food", subcategory: "Conserves", description: "Riz a grain long", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Sauce tomate 680ml", price: 2.99, category: "food", subcategory: "Conserves", description: "Sauce tomate Classico", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Tomates en des 796ml", price: 1.99, category: "food", subcategory: "Conserves", description: "Tomates italiennes", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Haricots rouges 540ml", price: 1.49, category: "food", subcategory: "Conserves", description: "Haricots en conserve", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Thon pale 170g", price: 2.49, category: "food", subcategory: "Conserves", description: "Thon en morceaux", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Mais en creme 398ml", price: 1.79, category: "food", subcategory: "Conserves", description: "Mais sucre", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Soupe poulet nouilles", price: 1.99, category: "food", subcategory: "Conserves", description: "Soupe Campbell's", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Pois chiches 540ml", price: 1.69, category: "food", subcategory: "Conserves", description: "Pois chiches en conserve", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Lentilles 540ml", price: 1.79, category: "food", subcategory: "Conserves", description: "Lentilles vertes", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Beurre arachide 500g", price: 4.99, category: "food", subcategory: "Conserves", description: "Beurre d'arachide craquant", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Confiture fraises 500ml", price: 3.99, category: "food", subcategory: "Conserves", description: "Confiture aux fraises", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Gruau avoine 1kg", price: 4.49, category: "food", subcategory: "Conserves", description: "Gruau instantane", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Farine tout usage 2kg", price: 3.99, category: "food", subcategory: "Conserves", description: "Farine de ble", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Sucre blanc 2kg", price: 3.49, category: "food", subcategory: "Conserves", description: "Sucre granule", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Huile canola 1L", price: 5.99, category: "food", subcategory: "Conserves", description: "Huile vegetale", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Vinaigre blanc 1L", price: 2.49, category: "food", subcategory: "Conserves", description: "Vinaigre distille", isEssential: false, isTaxable: false },
      // Boulangerie
      { id: randomUUID(), name: "Pain tranche blanc", price: 2.99, category: "food", subcategory: "Boulangerie", description: "Pain blanc 675g", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Pain ble entier", price: 3.49, category: "food", subcategory: "Boulangerie", description: "Pain 100% ble 675g", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Bagels nature 6", price: 3.99, category: "food", subcategory: "Boulangerie", description: "Bagels frais", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Tortillas 10po 8", price: 3.49, category: "food", subcategory: "Boulangerie", description: "Tortillas de ble", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Croissants 6", price: 4.99, category: "food", subcategory: "Boulangerie", description: "Croissants au beurre", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Muffins anglais 6", price: 3.29, category: "food", subcategory: "Boulangerie", description: "Muffins anglais", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Pain pita 6", price: 2.99, category: "food", subcategory: "Boulangerie", description: "Pain pita blanc", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Baguette", price: 2.49, category: "food", subcategory: "Boulangerie", description: "Baguette de ble", isEssential: false, isTaxable: false },
      // Bonbons & Sucreries (taxables)
      { id: randomUUID(), name: "Chocolat Lindt 100g", price: 4.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Chocolat noir 70%", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Chips Lays 235g", price: 4.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Chips nature", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Bonbons gelifies 175g", price: 2.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Oursons gelifies", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Biscuits Oreo 303g", price: 3.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Biscuits Oreo", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Barres Oh Henry 4", price: 4.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Barres chocolatees", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Creme glacee 1.5L", price: 5.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Creme glacee vanille", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Popcorn micro-ondes 3", price: 3.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Popcorn au beurre", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Doritos Nacho 255g", price: 4.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Tortillas nacho", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Pringles 165g", price: 3.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Chips en tube", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Kit Kat 8", price: 5.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Barres Kit Kat", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Gelato 500ml", price: 6.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Gelato artisanal", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Biscuits digestifs 400g", price: 3.49, category: "food", subcategory: "Bonbons & Sucreries", description: "Biscuits au ble", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "M&M's 200g", price: 4.99, category: "food", subcategory: "Bonbons & Sucreries", description: "Bonbons chocolates", isEssential: false, isTaxable: true },
      // Boissons
      { id: randomUUID(), name: "Jus d'orange 1.89L", price: 4.99, category: "food", subcategory: "Boissons", description: "Jus 100% pur", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Pepsi 2L", price: 2.99, category: "food", subcategory: "Boissons", description: "Boisson gazeuse", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Coca-Cola 2L", price: 2.99, category: "food", subcategory: "Boissons", description: "Boisson gazeuse", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Eau Eska 12x500ml", price: 3.99, category: "food", subcategory: "Boissons", description: "Eau de source", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Cafe moulu 340g", price: 8.99, category: "food", subcategory: "Boissons", description: "Cafe Maxwell House", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "The Red Rose 72", price: 5.99, category: "food", subcategory: "Boissons", description: "Sachets de the", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Gatorade 950ml", price: 2.49, category: "food", subcategory: "Boissons", description: "Boisson sportive", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Jus de pomme 1.89L", price: 3.99, category: "food", subcategory: "Boissons", description: "Jus 100% pomme", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Kombucha 473ml", price: 4.49, category: "food", subcategory: "Boissons", description: "Boisson probiotique", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Boisson sport Monster", price: 3.49, category: "food", subcategory: "Boissons", description: "Boisson energisante", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Jus de raisin 1.36L", price: 4.29, category: "food", subcategory: "Boissons", description: "Jus de raisin Welch's", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Lait d'amande 1.89L", price: 5.49, category: "food", subcategory: "Boissons", description: "Boisson aux amandes", isEssential: false, isTaxable: false },
      // Vêtements
      { id: randomUUID(), name: "T-shirt", price: 15, category: "clothing", description: "T-shirt coton classique", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Jeans bleu", price: 40, category: "clothing", description: "Jeans bleu slim", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Chaussures sport", price: 60, category: "clothing", description: "Sneakers decontractees", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Chaussettes", price: 5, category: "clothing", description: "Paire de chaussettes", isEssential: true, isTaxable: true },
      { id: randomUUID(), name: "Veste d'hiver", price: 80, category: "clothing", description: "Veste d'hiver", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Pull", price: 35, category: "clothing", description: "Pull chaud", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Bermuda", price: 25, category: "clothing", description: "Bermuda coton", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Sous-vetements 3", price: 18, category: "clothing", description: "Pack sous-vetements", isEssential: true, isTaxable: true },
      { id: randomUUID(), name: "Manteau automne", price: 65, category: "clothing", description: "Manteau leger", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Bottes hiver", price: 90, category: "clothing", description: "Bottes isolees impermeables", isEssential: true, isTaxable: true },
      { id: randomUUID(), name: "Robe ete", price: 45, category: "clothing", description: "Robe legere", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Short sport", price: 22, category: "clothing", description: "Short athletique", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Chandail laine", price: 55, category: "clothing", description: "Chandail en laine merinosé", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Tuque hiver", price: 12, category: "clothing", description: "Tuque tricotee", isEssential: true, isTaxable: true },
      { id: randomUUID(), name: "Mitaines", price: 15, category: "clothing", description: "Mitaines impermeables", isEssential: true, isTaxable: true },
      { id: randomUUID(), name: "Foulard", price: 20, category: "clothing", description: "Foulard laine", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Pyjama", price: 30, category: "clothing", description: "Pyjama coton doux", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Veston formel", price: 75, category: "clothing", description: "Veston pour occasions", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Ceinture cuir", price: 25, category: "clothing", description: "Ceinture en cuir", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Sac a dos", price: 45, category: "clothing", description: "Sac a dos ecole", isEssential: true, isTaxable: true },
      // Loisirs
      { id: randomUUID(), name: "Cinema", price: 14.99, category: "leisure", description: "Billet de cinema", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Jeu video", price: 79.99, category: "leisure", description: "Jeu video populaire", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Entree piscine", price: 8.00, category: "leisure", description: "Entree piscine/sport", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Cafe Starbucks", price: 5.99, category: "leisure", description: "Grand latte", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Livre", price: 24.99, category: "leisure", description: "Roman populaire", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Ticket concert", price: 75.00, category: "leisure", description: "Entree concert", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Abonnement Netflix", price: 16.99, category: "leisure", description: "Abonnement mensuel streaming", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Abonnement Spotify", price: 9.99, category: "leisure", description: "Musique en continu", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Billet musee", price: 18.00, category: "leisure", description: "Entree musee d'art", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Bowling", price: 22.00, category: "leisure", description: "Partie de bowling", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Paintball", price: 35.00, category: "leisure", description: "Session paintball", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Escape game", price: 28.00, category: "leisure", description: "Salle d'evasion", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Karting", price: 45.00, category: "leisure", description: "Session karting", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Salle de sport mois", price: 40.00, category: "leisure", description: "Abonnement mensuel gym", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Velo stationnaire", price: 299.00, category: "leisure", description: "Velo d'exercice", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Raquette tennis", price: 55.00, category: "leisure", description: "Raquette debutant", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Ballon soccer", price: 25.00, category: "leisure", description: "Ballon taille 5", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Casque velo", price: 40.00, category: "leisure", description: "Casque de protection", isEssential: true, isTaxable: true },
      { id: randomUUID(), name: "Planche a roulettes", price: 60.00, category: "leisure", description: "Skateboard complet", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Guitare acoustique", price: 150.00, category: "leisure", description: "Guitare debutant", isEssential: false, isTaxable: true },
      // Hygiène
      { id: randomUUID(), name: "Shampoing 400ml", price: 4.99, category: "food", subcategory: "Hygiène", description: "Shampoing tous types de cheveux", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Après-shampoing 400ml", price: 4.49, category: "food", subcategory: "Hygiène", description: "Après-shampoing hydratant", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Savon corporel 709ml", price: 3.99, category: "food", subcategory: "Hygiène", description: "Gel douche corps et mains", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Dentifrice 100ml", price: 3.49, category: "food", subcategory: "Hygiène", description: "Dentifrice blancheur", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Brosse à dents", price: 2.49, category: "food", subcategory: "Hygiène", description: "Brosse à dents souple", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Déodorant 50ml", price: 5.49, category: "food", subcategory: "Hygiène", description: "Anti-transpirant 48h", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Papier hygiénique 12 rouleaux", price: 9.99, category: "food", subcategory: "Hygiène", description: "Papier hygiénique double épaisseur", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Rasoir jetable 5 unités", price: 5.99, category: "food", subcategory: "Hygiène", description: "Rasoir jetable 3 lames", isEssential: false, isTaxable: false },
      { id: randomUUID(), name: "Serviettes hygiéniques 16 unités", price: 6.99, category: "food", subcategory: "Hygiène", description: "Serviettes hygiéniques ultra", isEssential: true, isTaxable: false },
      { id: randomUUID(), name: "Savon à main 200ml", price: 2.99, category: "food", subcategory: "Hygiène", description: "Savon liquide pour les mains", isEssential: true, isTaxable: false },
      // Pharmacie
      { id: randomUUID(), name: "Tylenol extra-fort 100 comprimés", price: 9.99, category: "food", subcategory: "Pharmacie", description: "Acétaminophène 500mg", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Advil 40 comprimés", price: 8.99, category: "food", subcategory: "Pharmacie", description: "Ibuprofène 200mg", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Vitamine D 1000UI 90 comprimés", price: 7.99, category: "food", subcategory: "Pharmacie", description: "Supplément vitamine D", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Bain de bouche 500ml", price: 4.99, category: "food", subcategory: "Pharmacie", description: "Bain de bouche antiseptique", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Crème hydratante 200ml", price: 6.99, category: "food", subcategory: "Pharmacie", description: "Lotion hydratante corps", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Bandages 30 unités", price: 4.49, category: "food", subcategory: "Pharmacie", description: "Pansements adhésifs assortis", isEssential: false, isTaxable: true },
      // Restauration
      { id: randomUUID(), name: "Tim Hortons café moyen", price: 2.49, category: "leisure", subcategory: "Restauration", description: "Café régulier ou décaféiné", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Tim Hortons Bagel BELT", price: 6.99, category: "leisure", subcategory: "Restauration", description: "Bagel avec bacon, oeuf, laitue, tomate", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "McDonald's Big Mac menu", price: 13.99, category: "leisure", subcategory: "Restauration", description: "Big Mac + frites + boisson", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "McDonald's McFlurry", price: 4.49, category: "leisure", subcategory: "Restauration", description: "Dessert glacé Oreo ou Smarties", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Poutine restaurant", price: 10.99, category: "leisure", subcategory: "Restauration", description: "Frites, fromage en grains, sauce brune", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Subway 30cm", price: 11.49, category: "leisure", subcategory: "Restauration", description: "Sous-marin 30cm garni", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Sushi 12 morceaux", price: 15.99, category: "leisure", subcategory: "Restauration", description: "Assortiment de sushis et makis", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Bubble tea 700ml", price: 7.49, category: "leisure", subcategory: "Restauration", description: "Thé aux perles de tapioca", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Pizza poche", price: 2.99, category: "leisure", subcategory: "Restauration", description: "Pizza en croûte format individuel", isEssential: false, isTaxable: true },
      // Loisirs supplémentaires
      { id: randomUUID(), name: "Abonnement Disney+", price: 11.99, category: "leisure", description: "Disney, Marvel, Star Wars et plus", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Musée Montréal entrée", price: 12.00, category: "leisure", description: "Entrée musée (MAM, Pointe-à-Callière…)", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Parc d'attractions journée", price: 45.00, category: "leisure", description: "Accès illimité aux manèges", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Karting 20 minutes", price: 32.00, category: "leisure", description: "Karting électrique en circuit", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Yoga cours mensuel", price: 40.00, category: "leisure", description: "Abonnement mensuel cours de yoga", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Ski alpin journée", price: 55.00, category: "leisure", description: "Forfait journée de ski alpin", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Spectacle humour billet", price: 35.00, category: "leisure", description: "Billet de show d'humour ou spectacle", isEssential: false, isTaxable: true },
      // Vêtements supplémentaires
      { id: randomUUID(), name: "Sous-vêtements pack 5", price: 22.00, category: "clothing", description: "Pack de 5 sous-vêtements coton", isEssential: true, isTaxable: true },
      { id: randomUUID(), name: "Collants hiver", price: 12.00, category: "clothing", description: "Collants thermiques pour l'hiver", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Imperméable léger", price: 55.00, category: "clothing", description: "Veste imperméable légère printemps", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Sandales d'été", price: 28.00, category: "clothing", description: "Sandales légères pour l'été", isEssential: false, isTaxable: true },
      { id: randomUUID(), name: "Lunettes de soleil", price: 25.00, category: "clothing", description: "Lunettes de soleil protection UV", isEssential: false, isTaxable: true },
    ];

    const items = allDefaultItems.filter(item => !existingNormalized.has(this.normalizeForComparison(item.name)));
    if (items.length === 0) {
      console.log("Catalog already up to date");
      return;
    }

    for (const item of items) {
      await this.sql`
        INSERT INTO catalog_items (id, name, price, category, subcategory, description, is_essential, is_taxable)
        VALUES (${item.id}, ${item.name}, ${item.price}, ${item.category}, ${item.subcategory ?? null}, ${item.description}, ${item.isEssential}, ${item.isTaxable})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`Seeded ${items.length} new catalog items (total: ${existingNames.size + items.length})`);
  }

  // ── Classes ──────────────────────────────────────────────────────
  async createClass(input: CreateClass): Promise<Class> {
    const upperCode = input.code.toUpperCase();
    const existing = await this.getClassByCode(upperCode);
    if (existing) throw new Error("Le code de classe existe déjà. Utilise un code unique.");

    const id = randomUUID();
    const defaultAmounts = { ...DEFAULT_EXPENSE_AMOUNTS };
    const predBudget = input.predefinedBudget ?? null;
    const rows = await this.sql`
      INSERT INTO classes (id, code, teacher_name, expense_amounts, mode, predefined_budget)
      VALUES (${id}, ${upperCode}, ${input.teacherName}, ${JSON.stringify(defaultAmounts)}, 'predefined', ${predBudget})
      RETURNING *
    `;
    return toClass(rows[0]);
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    const rows = await this.sql`SELECT * FROM classes WHERE code = ${code.toUpperCase()}`;
    return rows[0] ? toClass(rows[0]) : undefined;
  }

  async getClass(id: string): Promise<Class | undefined> {
    const rows = await this.sql`SELECT * FROM classes WHERE id = ${id}`;
    return rows[0] ? toClass(rows[0]) : undefined;
  }

  async getClassStudents(classId: string): Promise<Student[]> {
    const rows = await this.sql`SELECT * FROM students WHERE class_id = ${classId}`;
    return rows.map(toStudent);
  }

  async updateClassExpenseAmounts(classId: string, amounts: Map<string, number>): Promise<Class | undefined> {
    const amountsObj = Object.fromEntries(amounts);
    const rows = await this.sql`
      UPDATE classes SET expense_amounts = ${JSON.stringify(amountsObj)} WHERE id = ${classId} RETURNING *
    `;
    if (!rows[0]) return undefined;
    // Update all fixed expenses for students in this class — one query per category (parallel)
    const students = await this.getClassStudents(classId);
    await Promise.all(
      Array.from(amounts.entries()).map(([cat, amt]) =>
        this.sql`
          UPDATE fixed_expenses SET amount = ${amt}
          WHERE student_id = ANY(${students.map(s => s.id)}) AND category = ${cat}
        `
      )
    );
    return toClass(rows[0]);
  }

  async updateClassPredefinedBudget(classId: string, predefinedBudget: number): Promise<Class | undefined> {
    const rows = await this.sql`
      UPDATE classes SET predefined_budget = ${predefinedBudget} WHERE id = ${classId} RETURNING *
    `;
    return rows[0] ? toClass(rows[0]) : undefined;
  }

  // ── Students ─────────────────────────────────────────────────────
  async getStudent(id: string): Promise<Student | undefined> {
    const rows = await this.sql`SELECT * FROM students WHERE id = ${id}`;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async getAllStudents(): Promise<Student[]> {
    const rows = await this.sql`SELECT * FROM students`;
    return rows.map(toStudent);
  }

  async getStudentByNameAndClass(name: string, classId: string): Promise<Student | undefined> {
    const rows = await this.sql`
      SELECT * FROM students WHERE LOWER(name) = LOWER(${name}) AND class_id = ${classId}
    `;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const budgetHistory = [{ budget: input.budget, date: new Date() }];
    const monthlyBudget = input.monthlyBudget || input.budget;
    const rows = await this.sql`
      INSERT INTO students (id, name, class_id, budget, spent, savings, custom_expenses, scenario, budget_history, current_month, monthly_budget)
      VALUES (
        ${id}, ${input.name}, ${input.classId}, ${input.budget}, 0, 0,
        ${input.customExpenses ? JSON.stringify(input.customExpenses) : null},
        ${input.scenario ?? null},
        ${JSON.stringify(budgetHistory)},
        1,
        ${monthlyBudget}
      )
      RETURNING *
    `;

    return toStudent(rows[0]);
  }

  async updateStudentBudget(id: string, budget: number): Promise<Student | undefined> {
    const rows = await this.sql`UPDATE students SET budget = ${budget} WHERE id = ${id} RETURNING *`;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async updateStudentBudgetWithHistory(id: string, budget: number): Promise<Student | undefined> {
    const student = await this.getStudent(id);
    if (!student) return undefined;
    const history = [...(student.budgetHistory ?? []), { budget, date: new Date() }];
    const rows = await this.sql`
      UPDATE students SET budget = ${budget}, spent = 0, savings = 0,
        budget_history = ${JSON.stringify(history)}, monthly_budget = ${budget}
      WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async updateStudentBudgetAndSpent(id: string, budget: number, spent: number): Promise<Student | undefined> {
    const rows = await this.sql`
      UPDATE students SET budget = ${budget}, spent = ${spent} WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async clearStudentBudgetHistory(id: string): Promise<Student | undefined> {
    const rows = await this.sql`
      UPDATE students SET budget_history = '[]' WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async resetStudentBudget(id: string, newBudget: number): Promise<Student | undefined> {
    const history = [{ budget: newBudget, date: new Date() }];
    const rows = await this.sql`
      UPDATE students SET budget = ${newBudget}, spent = 0, savings = 0,
        budget_history = ${JSON.stringify(history)}
      WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async fullResetStudent(id: string): Promise<Student | undefined> {
    const student = await this.getStudent(id);
    if (!student) return undefined;
    const originalBudget = student.monthlyBudget || student.budget;
    const history = [{ budget: originalBudget, date: new Date() }];
    const rows = await this.sql`
      UPDATE students SET budget = ${originalBudget}, spent = 0, savings = 0,
        current_month = 1, monthly_budget = ${originalBudget},
        budget_history = ${JSON.stringify(history)}
      WHERE id = ${id} RETURNING *
    `;
    if (!rows[0]) return undefined;
    // Delete expenses
    await this.sql`DELETE FROM expenses WHERE student_id = ${id}`;
    // Delete and recreate fixed expenses — parallel
    const [, classData] = await Promise.all([
      this.sql`DELETE FROM fixed_expenses WHERE student_id = ${id}`,
      this.getClass(student.classId),
    ]);
    const amounts: Record<string, number> = student.customExpenses ?? classData?.expenseAmounts ?? DEFAULT_EXPENSE_AMOUNTS;
    await Promise.all([
      ...Object.entries(amounts).map(([cat, amt]) => this.createFixedExpense(id, cat, Number(amt))),
      this.sql`DELETE FROM badges WHERE student_id = ${id}`,
    ]);
    return toStudent(rows[0]);
  }

  async updateStudentSavings(id: string, savings: number): Promise<Student | undefined> {
    const rows = await this.sql`UPDATE students SET savings = ${savings} WHERE id = ${id} RETURNING *`;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async updateStudentCustomExpenses(id: string, customExpenses: Record<string, number>): Promise<Student | undefined> {
    const rows = await this.sql`
      UPDATE students SET custom_expenses = ${JSON.stringify(customExpenses)} WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  // ── Catalog ───────────────────────────────────────────────────────
  async getCatalogItems(category?: string): Promise<CatalogItem[]> {
    if (category) {
      const rows = await this.sql`SELECT * FROM catalog_items WHERE category = ${category} ORDER BY name`;
      return rows.map(toCatalogItem);
    }
    const rows = await this.sql`SELECT * FROM catalog_items ORDER BY category, name`;
    return rows.map(toCatalogItem);
  }

  async getCatalogItem(id: string): Promise<CatalogItem | undefined> {
    const rows = await this.sql`SELECT * FROM catalog_items WHERE id = ${id}`;
    return rows[0] ? toCatalogItem(rows[0]) : undefined;
  }

  async createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO catalog_items (id, name, price, category, subcategory, description, is_essential, is_taxable)
      VALUES (${id}, ${item.name}, ${item.price}, ${item.category}, ${item.subcategory ?? null}, ${item.description}, ${item.isEssential}, ${item.isTaxable})
      RETURNING *
    `;
    return toCatalogItem(rows[0]);
  }

  // ── Expenses ──────────────────────────────────────────────────────
  async addExpense(expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO expenses (id, student_id, item_id, amount, category, is_essential, feedback, message)
      VALUES (${id}, ${expense.studentId}, ${expense.itemId}, ${expense.amount}, ${expense.category}, ${expense.isEssential}, ${expense.feedback ?? "success"}, ${expense.message ?? ""})
      RETURNING *
    `;
    // Update student spent
    const student = await this.getStudent(expense.studentId);
    if (student) {
      const newSpent = (student.spent || 0) + expense.amount;
      await this.updateStudentBudgetAndSpent(expense.studentId, student.budget, newSpent);
    }
    return toExpense(rows[0]);
  }

  async getStudentExpenses(studentId: string): Promise<Expense[]> {
    const rows = await this.sql`SELECT * FROM expenses WHERE student_id = ${studentId} ORDER BY timestamp DESC`;
    return rows.map(toExpense);
  }

  async getAllExpenses(): Promise<Expense[]> {
    const rows = await this.sql`SELECT * FROM expenses ORDER BY timestamp DESC`;
    return rows.map(toExpense);
  }

  async deleteExpense(id: string): Promise<boolean> {
    const expRows = await this.sql`SELECT * FROM expenses WHERE id = ${id}`;
    if (!expRows[0]) return false;
    const expense = toExpense(expRows[0]);
    const student = await this.getStudent(expense.studentId);
    if (student) {
      const newSpent = Math.max(0, (student.spent || 0) - expense.amount);
      await this.updateStudentBudgetAndSpent(expense.studentId, student.budget, newSpent);
    }
    await this.sql`DELETE FROM expenses WHERE id = ${id}`;
    return true;
  }

  async deleteStudentExpenses(studentId: string): Promise<void> {
    await this.sql`DELETE FROM expenses WHERE student_id = ${studentId}`;
    const student = await this.getStudent(studentId);
    if (student) {
      await this.updateStudentBudgetAndSpent(studentId, student.budget, 0);
    }
  }

  // ── Fixed Expenses ────────────────────────────────────────────────
  async getFixedExpenses(studentId: string): Promise<FixedExpense[]> {
    const rows = await this.sql`SELECT * FROM fixed_expenses WHERE student_id = ${studentId}`;
    return rows.map(toFixedExpense);
  }

  async createFixedExpense(studentId: string, category: string, amount: number): Promise<FixedExpense> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO fixed_expenses (id, student_id, category, amount, is_paid, due_date, is_custom)
      VALUES (${id}, ${studentId}, ${category}, ${amount}, false, NOW(), false)
      RETURNING *
    `;
    return toFixedExpense(rows[0]);
  }

  async createCustomFixedExpense(studentId: string, name: string, amount: number): Promise<FixedExpense> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO fixed_expenses (id, student_id, category, amount, is_paid, due_date, is_custom)
      VALUES (${id}, ${studentId}, ${name}, ${amount}, false, NOW(), true)
      RETURNING *
    `;
    return toFixedExpense(rows[0]);
  }

  async deleteFixedExpense(id: string): Promise<boolean> {
    const rows = await this.sql`DELETE FROM fixed_expenses WHERE id = ${id} AND is_custom = true RETURNING id`;
    return rows.length > 0;
  }

  async deleteStudentFixedExpenses(studentId: string): Promise<void> {
    await this.sql`DELETE FROM fixed_expenses WHERE student_id = ${studentId}`;
  }

  async payFixedExpense(id: string): Promise<FixedExpense | undefined> {
    const rows = await this.sql`
      UPDATE fixed_expenses SET is_paid = true WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toFixedExpense(rows[0]) : undefined;
  }

  async updateFixedExpenseAmount(expenseId: string, amount: number): Promise<FixedExpense | undefined> {
    const rows = await this.sql`
      UPDATE fixed_expenses SET amount = ${amount} WHERE id = ${expenseId} RETURNING *
    `;
    return rows[0] ? toFixedExpense(rows[0]) : undefined;
  }

  async getDefaultExpenseAmounts(): Promise<Map<string, number>> {
    return new Map(Object.entries(DEFAULT_EXPENSE_AMOUNTS));
  }

  async setDefaultExpenseAmounts(_amounts: Map<string, number>): Promise<void> {}

  async updateAllStudentExpenseAmounts(amounts: Map<string, number>): Promise<void> {
    await Promise.all(
      Array.from(amounts.entries()).map(([cat, amt]) =>
        this.sql`UPDATE fixed_expenses SET amount = ${amt} WHERE category = ${cat} AND is_custom = false`
      )
    );
  }

  // ── Bonus Expenses ────────────────────────────────────────────────
  async createBonusExpense(input: CreateBonusExpense, classId: string): Promise<BonusExpense> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO bonus_expenses (id, student_id, class_id, title, description, amount, category, is_paid)
      VALUES (${id}, ${input.studentId}, ${classId}, ${input.title}, ${input.description}, ${input.amount}, ${input.category ?? "other"}, false)
      RETURNING *
    `;
    return toBonusExpense(rows[0]);
  }

  async getStudentBonusExpenses(studentId: string): Promise<BonusExpense[]> {
    const rows = await this.sql`SELECT * FROM bonus_expenses WHERE student_id = ${studentId}`;
    return rows.map(toBonusExpense);
  }

  async payBonusExpense(id: string): Promise<BonusExpense | undefined> {
    const rows = await this.sql`
      UPDATE bonus_expenses SET is_paid = true WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toBonusExpense(rows[0]) : undefined;
  }

  async deleteBonusExpense(id: string): Promise<boolean> {
    const bonusRows = await this.sql`SELECT * FROM bonus_expenses WHERE id = ${id}`;
    if (!bonusRows[0]) return false;
    const bonus = toBonusExpense(bonusRows[0]);
    if (bonus.isPaid) {
      const student = await this.getStudent(bonus.studentId);
      if (student) {
        const newSpent = Math.max(0, (student.spent || 0) - bonus.amount);
        await this.updateStudentBudgetAndSpent(bonus.studentId, student.budget, newSpent);
      }
    }
    await this.sql`DELETE FROM bonus_expenses WHERE id = ${id}`;
    return true;
  }

  async deleteClassBonusExpenses(classId: string): Promise<void> {
    await this.sql`DELETE FROM bonus_expenses WHERE class_id = ${classId}`;
  }

  // ── Challenges ────────────────────────────────────────────────────
  async createChallenge(input: CreateChallenge): Promise<Challenge> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO challenges (id, student_id, title, description, type, target_value, completed)
      VALUES (${id}, ${input.studentId}, ${input.title}, ${input.description}, ${input.type}, ${input.targetValue}, false)
      RETURNING *
    `;
    return toChallenge(rows[0]);
  }

  async getStudentChallenges(studentId: string): Promise<Challenge[]> {
    const rows = await this.sql`SELECT * FROM challenges WHERE student_id = ${studentId}`;
    return rows.map(toChallenge);
  }

  async deleteStudentChallenges(studentId: string): Promise<void> {
    await this.sql`DELETE FROM challenges WHERE student_id = ${studentId}`;
  }

  async completeChallenge(id: string): Promise<Challenge | undefined> {
    const rows = await this.sql`
      UPDATE challenges SET completed = true WHERE id = ${id} RETURNING *
    `;
    return rows[0] ? toChallenge(rows[0]) : undefined;
  }

  // ── Custom Challenges ─────────────────────────────────────────────
  async createCustomChallenge(input: CreateCustomChallenge): Promise<CustomChallenge> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO custom_challenges (id, class_id, teacher_id, title, description, type, target_value, completed_by)
      VALUES (${id}, ${input.classId}, 'system', ${input.title}, ${input.description}, ${input.type}, ${input.targetValue}, '[]')
      RETURNING *
    `;
    return toCustomChallenge(rows[0]);
  }

  async getClassCustomChallenges(classId: string): Promise<CustomChallenge[]> {
    const rows = await this.sql`SELECT * FROM custom_challenges WHERE class_id = ${classId}`;
    return rows.map(toCustomChallenge);
  }

  async completeCustomChallenge(id: string, studentId: string): Promise<CustomChallenge | undefined> {
    const rows = await this.sql`SELECT * FROM custom_challenges WHERE id = ${id}`;
    if (!rows[0]) return undefined;
    const challenge = toCustomChallenge(rows[0]);
    if (!challenge.completedBy.includes(studentId)) {
      challenge.completedBy.push(studentId);
    }
    const updated = await this.sql`
      UPDATE custom_challenges SET completed_by = ${JSON.stringify(challenge.completedBy)} WHERE id = ${id} RETURNING *
    `;
    return toCustomChallenge(updated[0]);
  }

  // ── Teacher Messages ──────────────────────────────────────────────
  async createTeacherMessage(input: CreateTeacherMessage): Promise<TeacherMessage> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO teacher_messages (id, class_id, student_id, teacher_id, content, type)
      VALUES (${id}, ${input.classId}, ${input.studentId ?? null}, 'system', ${input.content}, ${input.type})
      RETURNING *
    `;
    return toTeacherMessage(rows[0]);
  }

  async getClassMessages(classId: string): Promise<TeacherMessage[]> {
    const rows = await this.sql`SELECT * FROM teacher_messages WHERE class_id = ${classId} ORDER BY timestamp DESC`;
    return rows.map(toTeacherMessage);
  }

  async getStudentMessages(studentId: string, classId: string): Promise<TeacherMessage[]> {
    const rows = await this.sql`
      SELECT tm.* FROM teacher_messages tm
      JOIN students s ON s.id = ${studentId}
      WHERE tm.class_id = ${classId}
        AND (tm.student_id IS NULL OR tm.student_id = ${studentId})
        AND tm.timestamp >= s.created_at
      ORDER BY tm.timestamp DESC
    `;
    return rows.map(toTeacherMessage);
  }

  // ── Surprise Events ───────────────────────────────────────────────
  async createSurpriseEvent(input: CreateSurpriseEvent): Promise<SurpriseEvent> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO surprise_events (id, class_id, student_id, type, title, description, amount)
      VALUES (${id}, ${input.classId}, ${input.studentId ?? null}, ${input.type}, ${input.title}, ${input.description}, ${input.amount})
      RETURNING *
    `;
    return toSurpriseEvent(rows[0]);
  }

  async getSurpriseEvent(eventId: string): Promise<SurpriseEvent | undefined> {
    const rows = await this.sql`SELECT * FROM surprise_events WHERE id = ${eventId}`;
    return rows[0] ? toSurpriseEvent(rows[0]) : undefined;
  }

  async getClassSurpriseEvents(classId: string): Promise<SurpriseEvent[]> {
    const rows = await this.sql`SELECT * FROM surprise_events WHERE class_id = ${classId} AND applied_at IS NULL`;
    return rows.map(toSurpriseEvent);
  }

  async applyStudentSurpriseEvent(eventId: string, studentId: string): Promise<SurpriseEvent | undefined> {
    const rows = await this.sql`
      UPDATE surprise_events SET applied_at = NOW(), student_id = ${studentId} WHERE id = ${eventId} RETURNING *
    `;
    return rows[0] ? toSurpriseEvent(rows[0]) : undefined;
  }

  async getStudentAppliedEvents(studentId: string): Promise<SurpriseEvent[]> {
    const rows = await this.sql`
      SELECT * FROM surprise_events WHERE student_id = ${studentId} AND applied_at IS NOT NULL ORDER BY applied_at DESC
    `;
    return rows.map(toSurpriseEvent);
  }

  // ── Snapshots ─────────────────────────────────────────────────────
  async createSnapshot(studentId: string, label: string): Promise<BudgetSnapshot> {
    const student = await this.getStudent(studentId);
    if (!student) throw new Error("Étudiant non trouvé");

    const existing = await this.getStudentSnapshots(studentId);
    if (existing.length >= 3) {
      const oldest = existing[existing.length - 1];
      await this.sql`DELETE FROM budget_snapshots WHERE id = ${oldest.id}`;
    }

    const expenses = await this.getStudentExpenses(studentId);
    const fixedExpenses = await this.getFixedExpenses(studentId);
    const bonusExpenses = await this.getStudentBonusExpenses(studentId);
    const challenges = await this.getStudentChallenges(studentId);

    const id = randomUUID();
    const studentState = { budget: student.budget, spent: student.spent, savings: student.savings };
    const rows = await this.sql`
      INSERT INTO budget_snapshots (id, student_id, label, student_state, expenses, fixed_expenses, bonus_expenses, challenges)
      VALUES (
        ${id}, ${studentId}, ${label},
        ${JSON.stringify(studentState)},
        ${JSON.stringify(expenses)},
        ${JSON.stringify(fixedExpenses)},
        ${JSON.stringify(bonusExpenses)},
        ${JSON.stringify(challenges)}
      )
      RETURNING *
    `;
    return toSnapshot(rows[0]);
  }

  async getStudentSnapshots(studentId: string): Promise<BudgetSnapshot[]> {
    const rows = await this.sql`
      SELECT * FROM budget_snapshots WHERE student_id = ${studentId} ORDER BY created_at DESC
    `;
    return rows.map(toSnapshot);
  }

  async restoreSnapshot(snapshotId: string): Promise<Student | undefined> {
    const snapRows = await this.sql`SELECT * FROM budget_snapshots WHERE id = ${snapshotId}`;
    if (!snapRows[0]) return undefined;
    const snapshot = toSnapshot(snapRows[0]);

    const student = await this.getStudent(snapshot.studentId);
    if (!student) return undefined;

    const updated = await this.sql`
      UPDATE students SET budget = ${snapshot.studentState.budget}, spent = ${snapshot.studentState.spent}, savings = ${snapshot.studentState.savings}
      WHERE id = ${snapshot.studentId} RETURNING *
    `;

    // Delete all related data in parallel, then restore in parallel
    await Promise.all([
      this.sql`DELETE FROM expenses WHERE student_id = ${snapshot.studentId}`,
      this.sql`DELETE FROM fixed_expenses WHERE student_id = ${snapshot.studentId}`,
      this.sql`DELETE FROM bonus_expenses WHERE student_id = ${snapshot.studentId}`,
      this.sql`DELETE FROM challenges WHERE student_id = ${snapshot.studentId}`,
    ]);

    await Promise.all([
      ...snapshot.expenses.map(exp => this.sql`
        INSERT INTO expenses (id, student_id, item_id, amount, category, is_essential, timestamp, feedback, message)
        VALUES (${exp.id}, ${exp.studentId}, ${exp.itemId}, ${exp.amount}, ${exp.category}, ${exp.isEssential}, ${exp.timestamp}, ${exp.feedback}, ${exp.message})
        ON CONFLICT (id) DO NOTHING
      `),
      ...snapshot.fixedExpenses.map(fe => this.sql`
        INSERT INTO fixed_expenses (id, student_id, category, amount, is_paid, due_date)
        VALUES (${fe.id}, ${fe.studentId}, ${fe.category}, ${fe.amount}, ${fe.isPaid}, ${fe.dueDate})
        ON CONFLICT (id) DO NOTHING
      `),
      ...snapshot.bonusExpenses.map(be => this.sql`
        INSERT INTO bonus_expenses (id, student_id, class_id, title, description, amount, category, created_at, is_paid)
        VALUES (${be.id}, ${be.studentId}, ${be.classId}, ${be.title}, ${be.description}, ${be.amount}, ${be.category}, ${be.createdAt}, ${be.isPaid})
        ON CONFLICT (id) DO NOTHING
      `),
      ...snapshot.challenges.map(ch => this.sql`
        INSERT INTO challenges (id, student_id, title, description, type, target_value, completed, created_at)
        VALUES (${ch.id}, ${ch.studentId}, ${ch.title}, ${ch.description}, ${ch.type}, ${ch.targetValue}, ${ch.completed}, ${ch.createdAt})
        ON CONFLICT (id) DO NOTHING
      `),
    ]);

    return toStudent(updated[0]);
  }

  async deleteSnapshot(snapshotId: string): Promise<boolean> {
    const result = await this.sql`DELETE FROM budget_snapshots WHERE id = ${snapshotId} RETURNING id`;
    return result.length > 0;
  }

  // ── Month ─────────────────────────────────────────────────────────
  async startNewMonth(studentId: string): Promise<Student | undefined> {
    const student = await this.getStudent(studentId);
    if (!student) return undefined;

    const classData = await this.getClass(student.classId);
    const monthlyBudget = student.monthlyBudget || student.budget || classData?.predefinedBudget || 1500;
    const previousMonth = student.currentMonth || 1;
    const newMonth = previousMonth + 1;
    const remainingBudget = Math.max(0, student.budget);
    const totalSavings = student.savings + remainingBudget;

    const history = [
      ...(student.budgetHistory ?? []),
      { budget: student.budget, date: new Date() },
    ];

    const rows = await this.sql`
      UPDATE students
      SET budget = ${monthlyBudget}, spent = 0, savings = ${totalSavings},
          current_month = ${newMonth}, monthly_budget = ${monthlyBudget},
          budget_history = ${JSON.stringify(history)}
      WHERE id = ${studentId} RETURNING *
    `;

    await this.resetFixedExpensesForNewMonth(studentId);
    return rows[0] ? toStudent(rows[0]) : undefined;
  }

  async resetFixedExpensesForNewMonth(studentId: string): Promise<void> {
    await this.sql`
      UPDATE fixed_expenses SET is_paid = false, due_date = NOW() WHERE student_id = ${studentId}
    `;
  }

  // ── Badges ────────────────────────────────────────────────────────
  async awardBadge(studentId: string, type: Badge["type"], tier: Badge["tier"] = "bronze"): Promise<Badge> {
    const existing = await this.getStudentBadgeByType(studentId, type);
    if (existing) {
      const rows = await this.sql`
        UPDATE badges SET tier = ${tier}, earned_at = NOW() WHERE id = ${existing.id} RETURNING *
      `;
      return toBadge(rows[0]);
    }
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO badges (id, type, tier, student_id) VALUES (${id}, ${type}, ${tier}, ${studentId}) RETURNING *
    `;
    return toBadge(rows[0]);
  }

  async getStudentBadges(studentId: string): Promise<Badge[]> {
    const rows = await this.sql`SELECT * FROM badges WHERE student_id = ${studentId}`;
    return rows.map(toBadge);
  }

  async hasStudentBadge(studentId: string, type: Badge["type"]): Promise<boolean> {
    const rows = await this.sql`SELECT id FROM badges WHERE student_id = ${studentId} AND type = ${type}`;
    return rows.length > 0;
  }

  async getStudentBadgeByType(studentId: string, type: Badge["type"]): Promise<Badge | undefined> {
    const rows = await this.sql`SELECT * FROM badges WHERE student_id = ${studentId} AND type = ${type}`;
    return rows[0] ? toBadge(rows[0]) : undefined;
  }

  // ── Savings Goals ─────────────────────────────────────────────────
  async createSavingsGoal(input: CreateSavingsGoal): Promise<SavingsGoal> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO savings_goals (id, student_id, title, target_amount, current_amount, deadline, completed)
      VALUES (${id}, ${input.studentId}, ${input.title}, ${input.targetAmount}, 0, ${input.deadline ? new Date(input.deadline) : null}, false)
      RETURNING *
    `;
    return toSavingsGoal(rows[0]);
  }

  async getStudentSavingsGoals(studentId: string): Promise<SavingsGoal[]> {
    const rows = await this.sql`SELECT * FROM savings_goals WHERE student_id = ${studentId}`;
    return rows.map(toSavingsGoal);
  }

  async updateSavingsGoalProgress(goalId: string, currentAmount: number): Promise<SavingsGoal | undefined> {
    const goalRows = await this.sql`SELECT * FROM savings_goals WHERE id = ${goalId}`;
    if (!goalRows[0]) return undefined;
    const goal = toSavingsGoal(goalRows[0]);
    const completed = currentAmount >= goal.targetAmount;
    const rows = await this.sql`
      UPDATE savings_goals SET current_amount = ${currentAmount}, completed = ${completed} WHERE id = ${goalId} RETURNING *
    `;
    return toSavingsGoal(rows[0]);
  }

  async completeSavingsGoal(goalId: string): Promise<SavingsGoal | undefined> {
    const rows = await this.sql`SELECT * FROM savings_goals WHERE id = ${goalId}`;
    if (!rows[0]) return undefined;
    const goal = toSavingsGoal(rows[0]);
    const updated = await this.sql`
      UPDATE savings_goals SET completed = true, current_amount = ${goal.targetAmount} WHERE id = ${goalId} RETURNING *
    `;
    return toSavingsGoal(updated[0]);
  }

  async deleteSavingsGoal(goalId: string): Promise<boolean> {
    const result = await this.sql`DELETE FROM savings_goals WHERE id = ${goalId} RETURNING id`;
    return result.length > 0;
  }

  // ── Class Challenges ──────────────────────────────────────────────
  async createClassChallenge(input: CreateClassChallenge): Promise<ClassChallenge> {
    const id = randomUUID();
    const rows = await this.sql`
      INSERT INTO class_challenges (id, class_id, title, description, type, target_value, reward, deadline, completed_by)
      VALUES (${id}, ${input.classId}, ${input.title}, ${input.description}, ${input.type}, ${input.targetValue}, ${input.reward ?? null}, ${input.deadline ? new Date(input.deadline) : null}, '[]')
      RETURNING *
    `;
    return toClassChallenge(rows[0]);
  }

  async getClassChallenges(classId: string): Promise<ClassChallenge[]> {
    const rows = await this.sql`SELECT * FROM class_challenges WHERE class_id = ${classId}`;
    return rows.map(toClassChallenge);
  }

  async completeClassChallenge(challengeId: string, studentId: string): Promise<ClassChallenge | undefined> {
    const rows = await this.sql`SELECT * FROM class_challenges WHERE id = ${challengeId}`;
    if (!rows[0]) return undefined;
    const challenge = toClassChallenge(rows[0]);
    if (!challenge.completedBy.includes(studentId)) {
      challenge.completedBy.push(studentId);
    }
    const updated = await this.sql`
      UPDATE class_challenges SET completed_by = ${JSON.stringify(challenge.completedBy)} WHERE id = ${challengeId} RETURNING *
    `;
    return toClassChallenge(updated[0]);
  }

  async deleteClassChallenge(challengeId: string): Promise<boolean> {
    const result = await this.sql`DELETE FROM class_challenges WHERE id = ${challengeId} RETURNING id`;
    return result.length > 0;
  }

  // ── Leaderboard ───────────────────────────────────────────────────
  async getClassLeaderboard(classId: string): Promise<Array<{studentId: string; name: string; savings: number; badgeCount: number; challengesCompleted: number}>> {
    const students = await this.getClassStudents(classId);
    const challenges = await this.getClassChallenges(classId);
    const leaderboard = await Promise.all(students.map(async (student) => {
      const badges = await this.getStudentBadges(student.id);
      const challengesCompleted = challenges.filter(c => c.completedBy.includes(student.id)).length;
      return { studentId: student.id, name: student.name, savings: student.savings, badgeCount: badges.length, challengesCompleted };
    }));
    return leaderboard.sort((a, b) => {
      if (b.savings !== a.savings) return b.savings - a.savings;
      if (b.badgeCount !== a.badgeCount) return b.badgeCount - a.badgeCount;
      return b.challengesCompleted - a.challengesCompleted;
    });
  }

  async createTeacherInvite(note?: string): Promise<TeacherInvite> {
    const id = randomUUID();
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const [row] = await this.sql`
      INSERT INTO teacher_invites (id, code, note, used) VALUES (${id}, ${code}, ${note ?? null}, false) RETURNING *
    `;
    return { id: row.id, code: row.code, note: row.note ?? undefined, createdAt: new Date(row.created_at), used: row.used };
  }

  async getTeacherInvites(): Promise<TeacherInvite[]> {
    const rows = await this.sql`SELECT * FROM teacher_invites ORDER BY created_at DESC`;
    return rows.map(r => ({ id: r.id, code: r.code, note: r.note ?? undefined, createdAt: new Date(r.created_at), used: r.used, usedAt: r.used_at ? new Date(r.used_at) : undefined }));
  }

  async validateTeacherInvite(code: string): Promise<TeacherInvite | null> {
    const rows = await this.sql`SELECT * FROM teacher_invites WHERE code = ${code} AND used = false`;
    if (!rows[0]) return null;
    const r = rows[0];
    return { id: r.id, code: r.code, note: r.note ?? undefined, createdAt: new Date(r.created_at), used: r.used };
  }

  async useTeacherInvite(code: string): Promise<boolean> {
    const result = await this.sql`UPDATE teacher_invites SET used = true, used_at = NOW() WHERE code = ${code} AND used = false`;
    return (result.count ?? 0) > 0;
  }

  async deleteTeacherInvite(id: string): Promise<boolean> {
    const result = await this.sql`DELETE FROM teacher_invites WHERE id = ${id}`;
    return (result.count ?? 0) > 0;
  }
}
