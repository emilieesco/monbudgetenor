import { type Student, type CatalogItem, type Expense, type FixedExpense, type InsertStudent, type InsertCatalogItem, type InsertExpense, type Class, type CreateClass, type BonusExpense, type CreateBonusExpense, type Challenge, type CreateChallenge, type CustomChallenge, type CreateCustomChallenge, type TeacherMessage, type CreateTeacherMessage, type SurpriseEvent, type CreateSurpriseEvent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createClass(input: CreateClass): Promise<Class>;
  getClassByCode(code: string): Promise<Class | undefined>;
  getClass(id: string): Promise<Class | undefined>;
  getClassStudents(classId: string): Promise<Student[]>;
  updateClassExpenseAmounts(classId: string, amounts: Map<string, number>): Promise<Class | undefined>;
  updateClassPredefinedBudget(classId: string, predefinedBudget: number): Promise<Class | undefined>;
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  getStudentByNameAndClass(name: string, classId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudentBudget(id: string, budget: number): Promise<Student | undefined>;
  updateStudentBudgetWithHistory(id: string, budget: number): Promise<Student | undefined>;
  updateStudentBudgetAndSpent(id: string, budget: number, spent: number): Promise<Student | undefined>;
  updateStudentSavings(id: string, savings: number): Promise<Student | undefined>;
  getCatalogItems(category?: string): Promise<CatalogItem[]>;
  getCatalogItem(id: string): Promise<CatalogItem | undefined>;
  createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem>;
  addExpense(expense: InsertExpense): Promise<Expense>;
  getStudentExpenses(studentId: string): Promise<Expense[]>;
  getAllExpenses(): Promise<Expense[]>;
  getFixedExpenses(studentId: string): Promise<FixedExpense[]>;
  createFixedExpense(studentId: string, category: string, amount: number): Promise<FixedExpense>;
  deleteStudentFixedExpenses(studentId: string): Promise<void>;
  payFixedExpense(id: string): Promise<FixedExpense | undefined>;
  updateFixedExpenseAmount(expenseId: string, amount: number): Promise<FixedExpense | undefined>;
  getDefaultExpenseAmounts(): Promise<Map<string, number>>;
  setDefaultExpenseAmounts(amounts: Map<string, number>): Promise<void>;
  updateAllStudentExpenseAmounts(amounts: Map<string, number>): Promise<void>;
  createBonusExpense(input: CreateBonusExpense, classId: string): Promise<BonusExpense>;
  getStudentBonusExpenses(studentId: string): Promise<BonusExpense[]>;
  payBonusExpense(id: string): Promise<BonusExpense | undefined>;
  deleteClassBonusExpenses(classId: string): Promise<void>;
  createChallenge(input: CreateChallenge): Promise<Challenge>;
  getStudentChallenges(studentId: string): Promise<Challenge[]>;
  deleteStudentChallenges(studentId: string): Promise<void>;
  completeChallenge(id: string): Promise<Challenge | undefined>;
  createCustomChallenge(input: CreateCustomChallenge): Promise<CustomChallenge>;
  getClassCustomChallenges(classId: string): Promise<CustomChallenge[]>;
  completeCustomChallenge(id: string, studentId: string): Promise<CustomChallenge | undefined>;
  createTeacherMessage(input: CreateTeacherMessage): Promise<TeacherMessage>;
  getClassMessages(classId: string): Promise<TeacherMessage[]>;
  getStudentMessages(studentId: string): Promise<TeacherMessage[]>;
  createSurpriseEvent(input: CreateSurpriseEvent): Promise<SurpriseEvent>;
  getClassSurpriseEvents(classId: string): Promise<SurpriseEvent[]>;
  applyStudentSurpriseEvent(eventId: string, studentId: string): Promise<SurpriseEvent | undefined>;
}

export class MemStorage implements IStorage {
  private classes: Map<string, Class> = new Map();
  private students: Map<string, Student>;
  private catalogItems: Map<string, CatalogItem>;
  private expenses: Map<string, Expense>;
  private fixedExpenses: Map<string, FixedExpense>;
  private bonusExpenses: Map<string, BonusExpense> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private customChallenges: Map<string, CustomChallenge> = new Map();
  private teacherMessages: Map<string, TeacherMessage> = new Map();
  private surpriseEvents: Map<string, SurpriseEvent> = new Map();
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
    const defaultItems: CatalogItem[] = [
      // Produits laitiers
      { id: randomUUID(), name: "Lait 1L", price: 3, category: "food", subcategory: "Produits Laitiers", description: "Lait frais - 1 litre", isEssential: true },
      { id: randomUUID(), name: "Yaourt nature", price: 3, category: "food", subcategory: "Produits Laitiers", description: "Pack yaourt 4x125g", isEssential: true },
      { id: randomUUID(), name: "Fromage blanc", price: 3.5, category: "food", subcategory: "Produits Laitiers", description: "Fromage blanc 500g", isEssential: true },
      { id: randomUUID(), name: "Beurre salé", price: 3.5, category: "food", subcategory: "Produits Laitiers", description: "Beurre 250g", isEssential: true },
      { id: randomUUID(), name: "Crème fraîche", price: 2, category: "food", subcategory: "Produits Laitiers", description: "Crème fraîche 200ml", isEssential: false },
      { id: randomUUID(), name: "Mozzarella", price: 4, category: "food", subcategory: "Produits Laitiers", description: "Mozzarella 200g", isEssential: false },
      { id: randomUUID(), name: "Cheddar", price: 5, category: "food", subcategory: "Produits Laitiers", description: "Fromage cheddar 200g", isEssential: false },
      
      // Viandes et poissons
      { id: randomUUID(), name: "Poulet fermier", price: 8, category: "food", subcategory: "Viandes", description: "Poulet entier 1.5kg", isEssential: true },
      { id: randomUUID(), name: "Œufs fermiers", price: 4, category: "food", subcategory: "Viandes", description: "Douzaine d'œufs frais", isEssential: true },
      { id: randomUUID(), name: "Steak haché", price: 6, category: "food", subcategory: "Viandes", description: "Steak haché 500g", isEssential: true },
      { id: randomUUID(), name: "Porc côtelettes", price: 7, category: "food", subcategory: "Viandes", description: "Côtelettes de porc 600g", isEssential: false },
      { id: randomUUID(), name: "Bacon", price: 5, category: "food", subcategory: "Viandes", description: "Bacon 200g", isEssential: false },
      { id: randomUUID(), name: "Saumon frais", price: 12, category: "food", subcategory: "Viandes", description: "Filet de saumon 400g", isEssential: false },
      { id: randomUUID(), name: "Truite", price: 10, category: "food", subcategory: "Viandes", description: "Filet de truite 300g", isEssential: false },
      
      // Fruits et légumes
      { id: randomUUID(), name: "Bananes", price: 2, category: "food", subcategory: "Fruits & Légumes", description: "Régime de bananes", isEssential: false },
      { id: randomUUID(), name: "Pommes rouges", price: 3, category: "food", subcategory: "Fruits & Légumes", description: "2kg pommes rouges", isEssential: false },
      { id: randomUUID(), name: "Oranges", price: 3.5, category: "food", subcategory: "Fruits & Légumes", description: "1kg oranges juteuses", isEssential: false },
      { id: randomUUID(), name: "Carottes", price: 1.5, category: "food", subcategory: "Fruits & Légumes", description: "Botte de carottes 1kg", isEssential: false },
      { id: randomUUID(), name: "Brocoli", price: 2.5, category: "food", subcategory: "Fruits & Légumes", description: "Brocoli frais", isEssential: false },
      { id: randomUUID(), name: "Tomates", price: 2.5, category: "food", subcategory: "Fruits & Légumes", description: "Tomates rouges 1kg", isEssential: false },
      { id: randomUUID(), name: "Salade verte", price: 1.5, category: "food", subcategory: "Fruits & Légumes", description: "Laitue verte", isEssential: false },
      { id: randomUUID(), name: "Courgettes", price: 2, category: "food", subcategory: "Fruits & Légumes", description: "Courgettes 800g", isEssential: false },
      { id: randomUUID(), name: "Poivrons", price: 2.5, category: "food", subcategory: "Fruits & Légumes", description: "Poivrons rouges 500g", isEssential: false },
      
      // Conserves et pâtes
      { id: randomUUID(), name: "Pâtes", price: 1.5, category: "food", subcategory: "Conserves", description: "Pâtes 500g", isEssential: true },
      { id: randomUUID(), name: "Riz blanc", price: 2.5, category: "food", subcategory: "Conserves", description: "Riz blanc 1kg", isEssential: true },
      { id: randomUUID(), name: "Boîte tomates", price: 1.5, category: "food", subcategory: "Conserves", description: "Tomates en boîte 400g", isEssential: true },
      { id: randomUUID(), name: "Boîte haricots", price: 1, category: "food", subcategory: "Conserves", description: "Haricots rouges 400g", isEssential: false },
      { id: randomUUID(), name: "Conserve thon", price: 2, category: "food", subcategory: "Conserves", description: "Thon en boîte 185g", isEssential: false },
      { id: randomUUID(), name: "Maïs en boîte", price: 1.5, category: "food", subcategory: "Conserves", description: "Maïs 280g", isEssential: false },
      { id: randomUUID(), name: "Lentilles corail", price: 2.5, category: "food", subcategory: "Conserves", description: "Lentilles corail 500g", isEssential: false },
      
      // Produits sucrés et snacks
      { id: randomUUID(), name: "Pain complet", price: 2, category: "food", subcategory: "Boulangerie", description: "Baguette pain complet", isEssential: true },
      { id: randomUUID(), name: "Pain blanc", price: 1.5, category: "food", subcategory: "Boulangerie", description: "Pain de mie", isEssential: true },
      { id: randomUUID(), name: "Croissants", price: 4, category: "food", subcategory: "Boulangerie", description: "Pack 4 croissants", isEssential: false },
      { id: randomUUID(), name: "Chocolat noir", price: 2.5, category: "food", subcategory: "Bonbons & Sucreries", description: "Tablette chocolat 100g", isEssential: false },
      { id: randomUUID(), name: "Bonbons", price: 2, category: "food", subcategory: "Bonbons & Sucreries", description: "Assortiment bonbons", isEssential: false },
      { id: randomUUID(), name: "Chips nature", price: 3, category: "food", subcategory: "Bonbons & Sucreries", description: "Sac de chips nature", isEssential: false },
      { id: randomUUID(), name: "Biscuits", price: 2.5, category: "food", subcategory: "Bonbons & Sucreries", description: "Biscuits 200g", isEssential: false },
      
      // Boissons
      { id: randomUUID(), name: "Jus d'orange", price: 2.5, category: "food", subcategory: "Boissons", description: "Jus 100% 1L", isEssential: false },
      { id: randomUUID(), name: "Soda", price: 2, category: "food", subcategory: "Boissons", description: "Soda 1.5L", isEssential: false },
      { id: randomUUID(), name: "Eau minérale", price: 1.5, category: "food", subcategory: "Boissons", description: "Pack eau 6x1.5L", isEssential: false },
      { id: randomUUID(), name: "Café instant", price: 5, category: "food", subcategory: "Boissons", description: "Café instantané 200g", isEssential: false },
      { id: randomUUID(), name: "Thé", price: 3, category: "food", subcategory: "Boissons", description: "Boîte thé 25 sachets", isEssential: false },
      
      // Vêtements
      { id: randomUUID(), name: "T-shirt", price: 15, category: "clothing", description: "T-shirt coton classique", isEssential: false },
      { id: randomUUID(), name: "Jeans bleu", price: 40, category: "clothing", description: "Jeans bleu slim", isEssential: false },
      { id: randomUUID(), name: "Chaussures sport", price: 60, category: "clothing", description: "Sneakers décontractées", isEssential: false },
      { id: randomUUID(), name: "Chaussettes", price: 5, category: "clothing", description: "Paire de chaussettes", isEssential: true },
      { id: randomUUID(), name: "Veste d'hiver", price: 80, category: "clothing", description: "Veste d'hiver", isEssential: false },
      { id: randomUUID(), name: "Pull", price: 35, category: "clothing", description: "Pull chaud", isEssential: false },
      { id: randomUUID(), name: "Bermuda", price: 25, category: "clothing", description: "Bermuda coton", isEssential: false },
      
      // Loisirs
      { id: randomUUID(), name: "Cinéma", price: 10, category: "leisure", description: "Billet de cinéma", isEssential: false },
      { id: randomUUID(), name: "Jeu vidéo", price: 20, category: "leisure", description: "Jeu vidéo populaire", isEssential: false },
      { id: randomUUID(), name: "Entrée piscine", price: 12, category: "leisure", description: "Entrée piscine/sport", isEssential: false },
      { id: randomUUID(), name: "Café", price: 3, category: "leisure", description: "Boisson café", isEssential: false },
      { id: randomUUID(), name: "Livre", price: 15, category: "leisure", description: "Roman populaire", isEssential: false },
      { id: randomUUID(), name: "Ticket concert", price: 25, category: "leisure", description: "Entrée concert", isEssential: false },
    ];
    defaultItems.forEach(item => this.catalogItems.set(item.id, item));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async createClass(input: CreateClass): Promise<Class> {
    const upperCode = input.code.toUpperCase();
    
    // Check if class code already exists
    const existingClass = await this.getClassByCode(upperCode);
    if (existingClass) {
      throw new Error("Le code de classe existe déjà. Utilise un code unique.");
    }
    
    const id = randomUUID();
    const classData: Class = {
      id,
      code: upperCode,
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
    return classData;
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    const upperCode = code.toUpperCase();
    return Array.from(this.classes.values()).find(c => c.code === upperCode);
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassStudents(classId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(s => s.classId === classId);
  }

  async getStudentByNameAndClass(name: string, classId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.name.toLowerCase() === name.toLowerCase() && s.classId === classId);
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
            const updatedExpense = { ...expense, amount: newAmount };
            this.fixedExpenses.set(expenseId, updatedExpense);
          }
        }
      }
    }

    return updated;
  }

  async updateClassPredefinedBudget(classId: string, predefinedBudget: number): Promise<Class | undefined> {
    const classData = this.classes.get(classId);
    if (!classData) return undefined;
    const updated = { ...classData, predefinedBudget };
    this.classes.set(classId, updated);
    return updated;
  }

  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = {
      ...input,
      id,
      spent: 0,
      savings: 0,
      createdAt: new Date(),
    };
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
      const expenseId = randomUUID();
      const fixedExpense: FixedExpense = {
        id: expenseId,
        studentId: id,
        category: expense.name,
        amount: expense.amount,
        isPaid: false,
        dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      };
      this.fixedExpenses.set(expenseId, fixedExpense);
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

  async updateStudentBudgetWithHistory(id: string, budget: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const budgetHistory = student.budgetHistory || [];
    budgetHistory.push({ budget, date: new Date() });
    const updated = { ...student, budget, spent: 0, savings: 0, budgetHistory };
    this.students.set(id, updated);
    return updated;
  }

  async updateStudentBudgetAndSpent(id: string, budget: number, spent: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, budget, spent };
    this.students.set(id, updated);
    return updated;
  }

  async updateStudentSavings(id: string, savings: number): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    const updated = { ...student, savings: Math.max(0, savings) };
    this.students.set(id, updated);
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
    return catalogItem;
  }

  async addExpense(expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const newExpense: Expense = {
      ...expense,
      id,
      timestamp: new Date(),
    };
    this.expenses.set(id, newExpense);

    const student = await this.getStudent(expense.studentId);
    if (student) {
      await this.updateStudentBudget(expense.studentId, student.budget - expense.amount);
    }

    this.expenseSequence.push(newExpense);
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
    const expense: FixedExpense = {
      id,
      studentId,
      category,
      amount,
      isPaid: false,
      dueDate: new Date(),
    };
    this.fixedExpenses.set(id, expense);
    return expense;
  }

  async deleteStudentFixedExpenses(studentId: string): Promise<void> {
    for (const [id, expense] of this.fixedExpenses) {
      if (expense.studentId === studentId) {
        this.fixedExpenses.delete(id);
      }
    }
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
    return this.defaultExpenseAmounts;
  }

  async setDefaultExpenseAmounts(amounts: Map<string, number>): Promise<void> {
    this.defaultExpenseAmounts = amounts;
  }

  async updateAllStudentExpenseAmounts(amounts: Map<string, number>): Promise<void> {
    for (const [expenseId, expense] of this.fixedExpenses.entries()) {
      const newAmount = amounts.get(expense.category);
      if (newAmount !== undefined) {
        const updated = { ...expense, amount: newAmount };
        this.fixedExpenses.set(expenseId, updated);
      }
    }
  }

  async createBonusExpense(input: CreateBonusExpense, classId: string): Promise<BonusExpense> {
    const id = randomUUID();
    const bonus: BonusExpense = {
      id,
      ...input,
      classId,
      createdAt: new Date(),
      isPaid: false,
    };
    this.bonusExpenses.set(id, bonus);

    const student = await this.getStudent(input.studentId);
    if (student) {
      await this.updateStudentBudget(input.studentId, student.budget - input.amount);
    }

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
    return updated;
  }

  async deleteClassBonusExpenses(classId: string): Promise<void> {
    for (const [id, bonus] of this.bonusExpenses.entries()) {
      if (bonus.classId === classId) {
        this.bonusExpenses.delete(id);
      }
    }
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
  }

  async completeChallenge(id: string): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(id);
    if (!challenge) return undefined;
    const updated = { ...challenge, completed: true };
    this.challenges.set(id, updated);
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
    return message;
  }

  async getClassMessages(classId: string): Promise<TeacherMessage[]> {
    return Array.from(this.teacherMessages.values()).filter(m => m.classId === classId);
  }

  async getStudentMessages(studentId: string): Promise<TeacherMessage[]> {
    return Array.from(this.teacherMessages.values()).filter(m => !m.studentId || m.studentId === studentId);
  }

  async createSurpriseEvent(input: CreateSurpriseEvent): Promise<SurpriseEvent> {
    const id = randomUUID();
    const event: SurpriseEvent = {
      ...input,
      id,
      createdAt: new Date(),
    };
    this.surpriseEvents.set(id, event);
    return event;
  }

  async getClassSurpriseEvents(classId: string): Promise<SurpriseEvent[]> {
    return Array.from(this.surpriseEvents.values()).filter(e => e.classId === classId && !e.appliedAt);
  }

  async applyStudentSurpriseEvent(eventId: string, studentId: string): Promise<SurpriseEvent | undefined> {
    const event = this.surpriseEvents.get(eventId);
    if (!event) return undefined;
    const updated = { ...event, appliedAt: new Date(), studentId };
    this.surpriseEvents.set(eventId, updated);
    return updated;
  }
}

import { FileStorage } from "./file-storage";

export const storage = new FileStorage();
export const getStorage = async () => storage;
