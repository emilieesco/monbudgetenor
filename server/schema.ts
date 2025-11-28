import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const classesTable = pgTable("classes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  teacherName: text("teacher_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expenseAmounts: jsonb("expense_amounts").notNull(),
});

export const studentsTable = pgTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  classId: text("class_id").notNull().references(() => classesTable.id),
  budget: integer("budget").notNull(),
  spent: integer("spent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fixedExpensesTable = pgTable("fixed_expenses", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => studentsTable.id),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  dueDate: timestamp("due_date").notNull(),
});

export const bonusExpensesTable = pgTable("bonus_expenses", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => studentsTable.id),
  classId: text("class_id").notNull().references(() => classesTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isPaid: boolean("is_paid").notNull().default(false),
});

export const expensesTable = pgTable("expenses", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => studentsTable.id),
  itemId: text("item_id").notNull(),
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  isEssential: boolean("is_essential").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  feedback: text("feedback").notNull(),
  message: text("message").notNull(),
});

export const catalogItemsTable = pgTable("catalog_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  isEssential: boolean("is_essential").notNull(),
});
