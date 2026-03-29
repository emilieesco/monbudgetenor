import { z } from "zod";

// Classroom
export interface Class {
  id: string;
  code: string;
  teacherName: string;
  createdAt: Date;
  expenseAmounts: { [key: string]: number };
  mode: "predefined" | "custom" | "scenario";
  predefinedBudget?: number;
}

// Student with budget
export interface Student {
  id: string;
  name: string;
  classId: string;
  budget: number;
  spent: number;
  savings: number;
  createdAt: Date;
  customExpenses?: { [key: string]: number };
  scenario?: string;
  budgetHistory?: Array<{ budget: number; date: Date }>;
  currentMonth?: number;
  monthlyBudget?: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category: "food" | "clothing" | "leisure" | "transport";
  subcategory?: string;
  description: string;
  isEssential: boolean;
  isTaxable: boolean;
}

export interface Expense {
  id: string;
  studentId: string;
  itemId: string;
  amount: number;
  category: "food" | "clothing" | "leisure" | "rent";
  isEssential: boolean;
  timestamp: Date;
  feedback: "success" | "warning";
  message: string;
}

export interface FixedExpense {
  id: string;
  studentId: string;
  category: string;
  amount: number;
  isPaid: boolean;
  dueDate: Date;
  isCustom: boolean;
}

export interface BonusExpense {
  id: string;
  studentId: string;
  classId: string;
  title: string;
  description: string;
  amount: number;
  category: "transport" | "education" | "health" | "entertainment" | "utilities" | "food" | "clothing" | "emergency" | "other";
  createdAt: Date;
  isPaid: boolean;
}

export interface Challenge {
  id: string;
  studentId: string;
  title: string;
  description: string;
  type: "spending" | "essential" | "fixed" | "savings";
  targetValue: number;
  completed: boolean;
  createdAt: Date;
}

export interface CustomChallenge {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  description: string;
  type: "spending" | "savings" | "custom";
  targetValue: number;
  createdAt: Date;
  completedBy: string[];
}

export interface TeacherMessage {
  id: string;
  classId: string;
  studentId?: string;
  teacherId: string;
  content: string;
  type: "congratulations" | "warning" | "info";
  timestamp: Date;
}

export interface SurpriseEvent {
  id: string;
  classId: string;
  studentId?: string;
  type: "bonus_salary" | "promo" | "emergency_expense";
  title: string;
  description: string;
  amount: number;
  createdAt: Date;
  appliedAt?: Date;
}

export interface BudgetSnapshot {
  id: string;
  studentId: string;
  label: string;
  createdAt: Date;
  studentState: {
    budget: number;
    spent: number;
    savings: number;
  };
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  bonusExpenses: BonusExpense[];
  challenges: Challenge[];
}

// Badge tiers for gamification
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

// Badge system for gamification
export interface Badge {
  id: string;
  type: "first_purchase" | "saver" | "essential_master" | "budget_hero" | "challenge_complete" | "monthly_survivor";
  tier: BadgeTier;
  studentId: string;
  earnedAt: Date;
}

export const BADGE_TIER_THRESHOLDS = {
  saver: { bronze: 50, silver: 100, gold: 250, platinum: 500 },
  essential_master: { bronze: 50, silver: 70, gold: 85, platinum: 95 },
  budget_hero: { bronze: 5, silver: 10, gold: 15, platinum: 25 },
  challenge_complete: { bronze: 1, silver: 3, gold: 5, platinum: 10 },
  monthly_survivor: { bronze: 1, silver: 3, gold: 6, platinum: 12 },
};

export const BADGE_DEFINITIONS: Record<Badge["type"], { name: string; description: string; icon: string }> = {
  first_purchase: { name: "Premier Achat", description: "Vous avez fait votre premier achat!", icon: "🛒" },
  saver: { name: "Épargnant", description: "Vous avez économisé de l'argent", icon: "💰" },
  essential_master: { name: "Maître des Essentiels", description: "Un bon pourcentage de vos achats sont essentiels", icon: "⭐" },
  budget_hero: { name: "Héros du Budget", description: "Vous avez terminé le mois avec un surplus", icon: "🏆" },
  challenge_complete: { name: "Défi Relevé", description: "Vous avez complété des défis", icon: "🎯" },
  monthly_survivor: { name: "Survivant Mensuel", description: "Vous avez payé toutes vos dépenses fixes", icon: "✅" },
};

// Savings goal set by student
export interface SavingsGoal {
  id: string;
  studentId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
}

// Class challenge created by teacher (extending existing CustomChallenge)
export interface ClassChallenge {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: "save_amount" | "limit_spending" | "essential_ratio" | "custom";
  targetValue: number;
  reward?: string;
  deadline?: Date;
  createdAt: Date;
  completedBy: string[]; // student IDs who completed it
}

export const createSnapshotSchema = z.object({
  label: z.string().min(1).max(50),
});

export type CreateSnapshot = z.infer<typeof createSnapshotSchema>;

// Zod schemas for validation
export const studentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  budget: z.number().positive(),
  spent: z.number().nonnegative(),
  createdAt: z.date(),
});

export const insertStudentSchema = z.object({
  name: z.string().min(1),
  classId: z.string().min(1),
  budget: z.number().positive(),
  monthlyBudget: z.number().optional(),
  customExpenses: z.record(z.number()).optional(),
  scenario: z.string().optional(),
});

export const createClassSchema = z.object({
  code: z.string().min(3).max(10),
  teacherName: z.string().min(1),
  predefinedBudget: z.number().positive().optional(),
});

export const joinClassSchema = z.object({
  name: z.string().min(1),
  classCode: z.string().min(1),
  budget: z.number().positive(),
  scenario: z.string().optional(),
  customExpenses: z.record(z.number()).optional(),
});

export const createBonusExpenseSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum(["transport", "education", "health", "entertainment", "utilities", "food", "clothing", "emergency", "other"]).default("other"),
});

export const createChallengeSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["spending", "essential", "fixed", "savings"]),
  targetValue: z.number().positive(),
});

export type CreateChallenge = z.infer<typeof createChallengeSchema>;

export const catalogItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(["food", "clothing", "leisure", "transport"]),
  subcategory: z.string().optional(),
  description: z.string(),
  isEssential: z.boolean(),
  isTaxable: z.boolean(),
});

export const insertCatalogItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(["food", "clothing", "leisure", "transport"]),
  subcategory: z.string().optional(),
  description: z.string(),
  isEssential: z.boolean(),
  isTaxable: z.boolean(),
});

export const insertExpenseSchema = z.object({
  studentId: z.string().min(1),
  itemId: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum(["food", "clothing", "leisure", "rent", "transport"]),
  isEssential: z.boolean(),
  feedback: z.enum(["success", "warning"]).optional(),
  message: z.string().optional(),
});

export const updateBudgetSchema = z.object({
  budget: z.number().positive(),
});

export const createCustomChallengeSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["spending", "savings", "custom"]),
  targetValue: z.number().positive(),
});

export const createTeacherMessageSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().optional(),
  content: z.string().min(1),
  type: z.enum(["congratulations", "warning", "info"]),
});

export const createSurpriseEventSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().optional(),
  type: z.enum(["bonus_salary", "promo", "emergency_expense"]),
  title: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type CreateClass = z.infer<typeof createClassSchema>;
export type CreateBonusExpense = z.infer<typeof createBonusExpenseSchema>;
export type CreateCustomChallenge = z.infer<typeof createCustomChallengeSchema>;
export type CreateTeacherMessage = z.infer<typeof createTeacherMessageSchema>;
export type CreateSurpriseEvent = z.infer<typeof createSurpriseEventSchema>;

// Schemas for gamification
export const createSavingsGoalSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  deadline: z.string().optional(),
});

export const createClassChallengeSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(["save_amount", "limit_spending", "essential_ratio", "custom"]),
  targetValue: z.number().positive(),
  reward: z.string().optional(),
  deadline: z.string().optional(),
});

export type CreateSavingsGoal = z.infer<typeof createSavingsGoalSchema>;
export type CreateClassChallenge = z.infer<typeof createClassChallengeSchema>;

// Teacher Invite Codes
export interface TeacherInvite {
  id: string;
  code: string;
  note?: string;
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
}

export const createTeacherInviteSchema = z.object({
  note: z.string().optional(),
});
export type CreateTeacherInvite = z.infer<typeof createTeacherInviteSchema>;
