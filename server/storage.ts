import { type Student, type CatalogItem, type Expense, type FixedExpense, type InsertStudent, type InsertCatalogItem, type InsertExpense } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudentBudget(id: string, budget: number): Promise<Student | undefined>;

  // Catalog operations
  getCatalogItems(category?: string): Promise<CatalogItem[]>;
  getCatalogItem(id: string): Promise<CatalogItem | undefined>;
  createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem>;

  // Expense operations
  addExpense(expense: InsertExpense): Promise<Expense>;
  getStudentExpenses(studentId: string): Promise<Expense[]>;
  getAllExpenses(): Promise<Expense[]>;

  // Fixed expenses
  getFixedExpenses(studentId: string): Promise<FixedExpense[]>;
  createFixedExpense(studentId: string, category: string, amount: number): Promise<FixedExpense>;
  payFixedExpense(id: string): Promise<FixedExpense | undefined>;
  updateFixedExpenseAmount(expenseId: string, amount: number): Promise<FixedExpense | undefined>;
  getDefaultExpenseAmounts(): Promise<Map<string, number>>;
  setDefaultExpenseAmounts(amounts: Map<string, number>): Promise<void>;
  updateAllStudentExpenseAmounts(amounts: Map<string, number>): Promise<void>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student>;
  private catalogItems: Map<string, CatalogItem>;
  private expenses: Map<string, Expense>;
  private fixedExpenses: Map<string, FixedExpense>;
  private expenseSequence: Expense[] = [];
  private defaultExpenseAmounts: Map<string, number> = new Map();

  constructor() {
    this.students = new Map();
    this.catalogItems = new Map();
    this.expenses = new Map();
    this.fixedExpenses = new Map();
    this.initializeCatalog();
    this.initializeDefaultExpenses();
  }

  private initializeDefaultExpenses() {
    this.defaultExpenseAmounts.set("Loyer", 15);
    this.defaultExpenseAmounts.set("Internet", 5);
    this.defaultExpenseAmounts.set("Téléphone", 3);
    this.defaultExpenseAmounts.set("Hydro", 8);
    this.defaultExpenseAmounts.set("Assurance Voiture", 10);
    this.defaultExpenseAmounts.set("Assurance Maison", 7);
    this.defaultExpenseAmounts.set("Essence", 12);
    this.defaultExpenseAmounts.set("Nourriture", 20);
    this.defaultExpenseAmounts.set("Sortie", 5);
  }

  private initializeCatalog() {
    // Default catalog items
    const defaultItems: CatalogItem[] = [
      // Food
      { id: randomUUID(), name: "Lait", price: 3, category: "food", description: "1L de lait frais", isEssential: true },
      { id: randomUUID(), name: "Pain", price: 2, category: "food", description: "Baguette pain complet", isEssential: true },
      { id: randomUUID(), name: "Œufs", price: 4, category: "food", description: "Douzaine d'œufs", isEssential: true },
      { id: randomUUID(), name: "Poulet", price: 8, category: "food", description: "Poulet fermier", isEssential: true },
      { id: randomUUID(), name: "Pizza surgelée", price: 5, category: "food", description: "Pizza pepperoni", isEssential: false },
      { id: randomUUID(), name: "Chips", price: 3, category: "food", description: "Sac de chips nature", isEssential: false },
      { id: randomUUID(), name: "Bonbons", price: 2, category: "food", description: "Paquets de bonbons", isEssential: false },

      // Clothing
      { id: randomUUID(), name: "T-shirt", price: 15, category: "clothing", description: "T-shirt coton classique", isEssential: false },
      { id: randomUUID(), name: "Jeans", price: 40, category: "clothing", description: "Jeans bleu slim", isEssential: false },
      { id: randomUUID(), name: "Chaussures", price: 60, category: "clothing", description: "Sneakers décontractées", isEssential: false },
      { id: randomUUID(), name: "Chaussettes", price: 5, category: "clothing", description: "Paire de chaussettes", isEssential: true },
      { id: randomUUID(), name: "Veste", price: 80, category: "clothing", description: "Veste d'hiver", isEssential: false },

      // Leisure
      { id: randomUUID(), name: "Cinéma", price: 10, category: "leisure", description: "Billet de cinéma", isEssential: false },
      { id: randomUUID(), name: "Jeu vidéo", price: 20, category: "leisure", description: "Jeu vidéo populaire", isEssential: false },
      { id: randomUUID(), name: "Sport", price: 12, category: "leisure", description: "Entrée piscine/sport", isEssential: false },
      { id: randomUUID(), name: "Café", price: 3, category: "leisure", description: "Boisson café", isEssential: false },
    ];

    defaultItems.forEach(item => this.catalogItems.set(item.id, item));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = {
      ...input,
      id,
      spent: 0,
      createdAt: new Date(),
    };
    this.students.set(id, student);
    
    // Create all fixed expenses
    const fixedExpenses = [
      { name: "Loyer", amount: 15 },
      { name: "Internet", amount: 5 },
      { name: "Téléphone", amount: 3 },
      { name: "Hydro", amount: 8 },
      { name: "Assurance Voiture", amount: 10 },
      { name: "Assurance Maison", amount: 7 },
      { name: "Essence", amount: 12 },
      { name: "Nourriture", amount: 20 },
      { name: "Sortie", amount: 5 },
    ];
    
    for (const expense of fixedExpenses) {
      await this.createFixedExpense(id, expense.name, expense.amount);
    }
    
    return student;
  }

  async updateStudentBudget(id: string, budget: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updated = { ...student, budget };
    this.students.set(id, updated);
    return updated;
  }

  async getCatalogItems(category?: string): Promise<CatalogItem[]> {
    const items = Array.from(this.catalogItems.values());
    if (category) {
      return items.filter(item => item.category === category);
    }
    return items;
  }

  async getCatalogItem(id: string): Promise<CatalogItem | undefined> {
    return this.catalogItems.get(id);
  }

  async createCatalogItem(input: InsertCatalogItem): Promise<CatalogItem> {
    const id = randomUUID();
    const item: CatalogItem = { ...input, id };
    this.catalogItems.set(id, item);
    return item;
  }

  async addExpense(input: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...input,
      id,
      timestamp: new Date(),
      feedback: input.isEssential ? "success" : input.amount > 20 ? "warning" : "success",
      message: input.isEssential
        ? `💸 Bravo ! Tu économises !`
        : input.amount > 20
        ? `⚠ Dépassement`
        : `💸 Bravo ! Tu économises !`,
    };
    
    this.expenses.set(id, expense);
    this.expenseSequence.push(expense);
    
    // Update student spent amount
    const student = this.students.get(input.studentId);
    if (student) {
      const updated = { ...student, spent: student.spent + input.amount };
      this.students.set(input.studentId, updated);
    }
    
    return expense;
  }

  async getStudentExpenses(studentId: string): Promise<Expense[]> {
    return this.expenseSequence.filter(e => e.studentId === studentId);
  }

  async getAllExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getFixedExpenses(studentId: string): Promise<FixedExpense[]> {
    return Array.from(this.fixedExpenses.values()).filter(fe => fe.studentId === studentId);
  }

  async createFixedExpense(studentId: string, category: string, amount: number): Promise<FixedExpense> {
    const id = randomUUID();
    const expense: FixedExpense = {
      id,
      studentId,
      category,
      amount,
      isPaid: false,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    this.fixedExpenses.set(id, expense);
    return expense;
  }

  async payFixedExpense(id: string): Promise<FixedExpense | undefined> {
    const expense = this.fixedExpenses.get(id);
    if (!expense) return undefined;
    
    const updated = { ...expense, isPaid: true };
    this.fixedExpenses.set(id, updated);
    return updated;
  }

  async updateFixedExpenseAmount(expenseId: string, amount: number): Promise<FixedExpense | undefined> {
    const expense = this.fixedExpenses.get(expenseId);
    if (!expense) return undefined;

    const updated = { ...expense, amount };
    this.fixedExpenses.set(expenseId, updated);
    return updated;
  }

  async getDefaultExpenseAmounts(): Promise<Map<string, number>> {
    return new Map(this.defaultExpenseAmounts);
  }

  async setDefaultExpenseAmounts(amounts: Map<string, number>): Promise<void> {
    this.defaultExpenseAmounts = new Map(amounts);
    // Update all existing students' expenses
    await this.updateAllStudentExpenseAmounts(amounts);
  }

  async updateAllStudentExpenseAmounts(amounts: Map<string, number>): Promise<void> {
    // Update all fixed expenses with the new amounts
    for (const [expenseId, expense] of this.fixedExpenses.entries()) {
      const newAmount = amounts.get(expense.category);
      if (newAmount !== undefined) {
        const updated = { ...expense, amount: newAmount };
        this.fixedExpenses.set(expenseId, updated);
      }
    }
  }
}

export const storage = new MemStorage();
