import { z } from "zod";

// Classroom
export interface Class {
  id: string;
  code: string;
  teacherName: string;
  createdAt: Date;
  expenseAmounts: { [key: string]: number };
  mode: "predefined" | "custom" | "scenario";
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
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category: "food" | "clothing" | "leisure";
  description: string;
  isEssential: boolean;
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
}

export interface BonusExpense {
  id: string;
  studentId: string;
  classId: string;
  title: string;
  description: string;
  amount: number;
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
  customExpenses: z.record(z.number()).optional(),
  scenario: z.string().optional(),
});

export const createClassSchema = z.object({
  code: z.string().min(3).max(10),
  teacherName: z.string().min(1),
});

export const joinClassSchema = z.object({
  name: z.string().min(1),
  classCode: z.string().min(1),
  budget: z.number().positive(),
  scenario: z.string().optional(),
});

export const createBonusExpenseSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
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
  category: z.enum(["food", "clothing", "leisure"]),
  description: z.string(),
  isEssential: z.boolean(),
});

export const insertCatalogItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(["food", "clothing", "leisure"]),
  description: z.string(),
  isEssential: z.boolean(),
});

export const insertExpenseSchema = z.object({
  studentId: z.string().min(1),
  itemId: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum(["food", "clothing", "leisure", "rent"]),
  isEssential: z.boolean(),
  feedback: z.enum(["success", "warning"]),
  message: z.string(),
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
export type CreateChallenge = z.infer<typeof createChallengeSchema>;
export type CreateCustomChallenge = z.infer<typeof createCustomChallengeSchema>;
export type CreateTeacherMessage = z.infer<typeof createTeacherMessageSchema>;
export type CreateSurpriseEvent = z.infer<typeof createSurpriseEventSchema>;
