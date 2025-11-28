import { type Student, type CatalogItem, type Expense, type FixedExpense, type InsertStudent, type InsertCatalogItem, type InsertExpense, type Class, type CreateClass, type BonusExpense, type CreateBonusExpense } from "@shared/schema";
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
}

export class FileStorage implements IStorage {
  private dataFile: string;
  private classes: Map<string, Class> = new Map();
  private students: Map<string, Student> = new Map();
  private catalogItems: Map<string, CatalogItem> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private fixedExpenses: Map<string, FixedExpense> = new Map();
  private bonusExpenses: Map<string, BonusExpense> = new Map();

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
      };
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  private initializeCatalogIfEmpty() {
    if (this.catalogItems.size === 0) {
      const defaultItems: CatalogItem[] = [
        { id: randomUUID(), name: "Lait 1L", price: 3, category: "food", description: "Lait frais - 1 litre", isEssential: true },
        { id: randomUUID(), name: "Pain complet", price: 2, category: "food", description: "Baguette pain complet", isEssential: true },
        { id: randomUUID(), name: "Œufs fermiers", price: 4, category: "food", description: "Douzaine d'œufs frais", isEssential: true },
        { id: randomUUID(), name: "Poulet fermier", price: 8, category: "food", description: "Poulet 1.5kg", isEssential: true },
        { id: randomUUID(), name: "Fromage blanc", price: 3.5, category: "food", description: "Fromage blanc 500g", isEssential: true },
        { id: randomUUID(), name: "Riz blanc", price: 2.5, category: "food", description: "Riz blanc 1kg", isEssential: true },
        { id: randomUUID(), name: "Pâtes", price: 1.5, category: "food", description: "Pâtes 500g", isEssential: true },
        { id: randomUUID(), name: "Bananes", price: 2, category: "food", description: "Régime de bananes", isEssential: false },
        { id: randomUUID(), name: "Pommes rouges", price: 3, category: "food", description: "2kg pommes rouges", isEssential: false },
        { id: randomUUID(), name: "Oranges", price: 3.5, category: "food", description: "1kg oranges juteuses", isEssential: false },
        { id: randomUUID(), name: "Carottes", price: 1.5, category: "food", description: "Botte de carottes 1kg", isEssential: false },
        { id: randomUUID(), name: "Brocoli", price: 2.5, category: "food", description: "Brocoli frais", isEssential: false },
        { id: randomUUID(), name: "Tomates", price: 2.5, category: "food", description: "Tomates rouges 1kg", isEssential: false },
        { id: randomUUID(), name: "Salade verte", price: 1.5, category: "food", description: "Laitue verte", isEssential: false },
        { id: randomUUID(), name: "Pizza surgelée", price: 5, category: "food", description: "Pizza pepperoni", isEssential: false },
        { id: randomUUID(), name: "Chips nature", price: 3, category: "food", description: "Sac de chips nature", isEssential: false },
        { id: randomUUID(), name: "Chocolat", price: 2.5, category: "food", description: "Tablette chocolat", isEssential: false },
        { id: randomUUID(), name: "Bonbons", price: 2, category: "food", description: "Assortiment bonbons", isEssential: false },
        { id: randomUUID(), name: "Yaourt", price: 3, category: "food", description: "Pack yaourt 4x125g", isEssential: false },
        { id: randomUUID(), name: "Beurre", price: 3.5, category: "food", description: "Beurre 250g", isEssential: false },
        { id: randomUUID(), name: "Miel", price: 5, category: "food", description: "Miel 500g", isEssential: false },
        { id: randomUUID(), name: "Jus d'orange", price: 2.5, category: "food", description: "Jus 1L", isEssential: false },
        { id: randomUUID(), name: "Soda", price: 2, category: "food", description: "Soda 1.5L", isEssential: false },
        { id: randomUUID(), name: "T-shirt", price: 15, category: "clothing", description: "T-shirt coton classique", isEssential: false },
        { id: randomUUID(), name: "Jeans bleu", price: 40, category: "clothing", description: "Jeans bleu slim", isEssential: false },
        { id: randomUUID(), name: "Chaussures sport", price: 60, category: "clothing", description: "Sneakers décontractées", isEssential: false },
        { id: randomUUID(), name: "Chaussettes", price: 5, category: "clothing", description: "Paire de chaussettes", isEssential: true },
        { id: randomUUID(), name: "Veste d'hiver", price: 80, category: "clothing", description: "Veste d'hiver", isEssential: false },
        { id: randomUUID(), name: "Pull", price: 35, category: "clothing", description: "Pull chaud", isEssential: false },
        { id: randomUUID(), name: "Bermuda", price: 25, category: "clothing", description: "Bermuda coton", isEssential: false },
        { id: randomUUID(), name: "Cinéma", price: 10, category: "leisure", description: "Billet de cinéma", isEssential: false },
        { id: randomUUID(), name: "Jeu vidéo", price: 20, category: "leisure", description: "Jeu vidéo populaire", isEssential: false },
        { id: randomUUID(), name: "Entrée piscine", price: 12, category: "leisure", description: "Entrée piscine/sport", isEssential: false },
        { id: randomUUID(), name: "Café", price: 3, category: "leisure", description: "Boisson café", isEssential: false },
        { id: randomUUID(), name: "Livre", price: 15, category: "leisure", description: "Roman populaire", isEssential: false },
        { id: randomUUID(), name: "Ticket concert", price: 25, category: "leisure", description: "Entrée concert", isEssential: false },
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

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...input, id, spent: 0, createdAt: new Date() };
    this.students.set(id, student);

    const classData = await this.getClass(input.classId);
    const amounts = classData?.expenseAmounts || this.getDefaultAmounts();

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
      this.fixedExpenses.set(randomUUID(), {
        id: randomUUID(),
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

    const student = await this.getStudent(expense.studentId);
    if (student) {
      await this.updateStudentBudget(expense.studentId, student.budget - expense.amount);
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

    const student = await this.getStudent(input.studentId);
    if (student) {
      await this.updateStudentBudget(input.studentId, student.budget - input.amount);
    }

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
    this.save();
    return updated;
  }

  async deleteClassBonusExpenses(classId: string): Promise<void> {
    for (const [id, bonus] of this.bonusExpenses.entries()) {
      if (bonus.classId === classId) {
        this.bonusExpenses.delete(id);
      }
    }
    this.save();
  }
}
