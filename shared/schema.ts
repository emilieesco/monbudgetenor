import { z } from "zod";

// Student with budget
export interface Student {
  id: string;
  name: string;
  budget: number;
  spent: number;
  createdAt: Date;
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
  budget: z.number().positive(),
});

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

export const expenseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  itemId: z.string(),
  amount: z.number().positive(),
  category: z.enum(["food", "clothing", "leisure", "rent"]),
  isEssential: z.boolean(),
  timestamp: z.date(),
  feedback: z.enum(["success", "warning"]),
  message: z.string(),
});

export const insertExpenseSchema = z.object({
  studentId: z.string(),
  itemId: z.string(),
  amount: z.number().positive(),
  category: z.enum(["food", "clothing", "leisure", "rent"]),
  isEssential: z.boolean(),
});

export const updateBudgetSchema = z.object({
  budget: z.number().positive(),
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
