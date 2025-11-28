import { db } from "./db";
import { 
  classesTable, studentsTable, fixedExpensesTable, bonusExpensesTable, 
  expensesTable, catalogItemsTable 
} from "./schema";
import { eq, and } from "drizzle-orm";
import { 
  type Student, type CatalogItem, type Expense, type FixedExpense, 
  type InsertStudent, type InsertCatalogItem, type InsertExpense, 
  type Class, type CreateClass, type BonusExpense, type CreateBonusExpense 
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  async createClass(input: CreateClass): Promise<Class> {
    const id = randomUUID();
    const result = await db!.insert(classesTable).values({
      id,
      code: input.code.toUpperCase(),
      teacherName: input.teacherName,
      expenseAmounts: {
        "Loyer": 15, "Internet": 5, "Téléphone": 3, "Hydro": 8,
        "Assurance Voiture": 10, "Assurance Maison": 7, "Essence": 12,
        "Nourriture": 20, "Sortie": 5,
      },
    }).returning();
    return result[0] as Class;
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    const result = await db!.select().from(classesTable).where(eq(classesTable.code, code.toUpperCase()));
    return result[0] as Class | undefined;
  }

  async getClass(id: string): Promise<Class | undefined> {
    const result = await db!.select().from(classesTable).where(eq(classesTable.id, id));
    return result[0] as Class | undefined;
  }

  async getClassStudents(classId: string): Promise<Student[]> {
    return await db!.select().from(studentsTable).where(eq(studentsTable.classId, classId)) as Student[];
  }

  async updateClassExpenseAmounts(classId: string, amounts: Map<string, number>): Promise<Class | undefined> {
    const updated = await db!.update(classesTable)
      .set({ expenseAmounts: Object.fromEntries(amounts) })
      .where(eq(classesTable.id, classId))
      .returning();
    
    if (updated.length === 0) return undefined;
    
    const students = await this.getClassStudents(classId);
    for (const student of students) {
      const expenses = await db!.select().from(fixedExpensesTable).where(eq(fixedExpensesTable.studentId, student.id));
      for (const expense of expenses) {
        const newAmount = amounts.get(expense.category);
        if (newAmount !== undefined) {
          await db!.update(fixedExpensesTable).set({ amount: newAmount }).where(eq(fixedExpensesTable.id, expense.id));
        }
      }
    }
    
    return updated[0] as Class;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db!.select().from(studentsTable).where(eq(studentsTable.id, id));
    return result[0] as Student | undefined;
  }

  async getAllStudents(): Promise<Student[]> {
    return await db!.select().from(studentsTable) as Student[];
  }

  async createStudent(input: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const result = await db!.insert(studentsTable).values({
      id,
      ...input,
      spent: 0,
    }).returning();
    
    const student = result[0] as Student;
    const classData = await this.getClass(input.classId);
    const amounts = (classData?.expenseAmounts || {}) as Record<string, number>;
    
    const expenses = [
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
    
    for (const exp of expenses) {
      await db!.insert(fixedExpensesTable).values({
        id: randomUUID(),
        studentId: id,
        category: exp.name,
        amount: exp.amount,
        isPaid: false,
        dueDate: new Date(),
      });
    }
    
    return student;
  }

  async updateStudentBudget(id: string, budget: number): Promise<Student | undefined> {
    const result = await db!.update(studentsTable).set({ budget }).where(eq(studentsTable.id, id)).returning();
    return result[0] as Student | undefined;
  }

  async getCatalogItems(category?: string): Promise<CatalogItem[]> {
    let query = db!.select().from(catalogItemsTable);
    if (category) query = query.where(eq(catalogItemsTable.category, category));
    return await query as CatalogItem[];
  }

  async getCatalogItem(id: string): Promise<CatalogItem | undefined> {
    const result = await db!.select().from(catalogItemsTable).where(eq(catalogItemsTable.id, id));
    return result[0] as CatalogItem | undefined;
  }

  async createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem> {
    const id = randomUUID();
    const result = await db!.insert(catalogItemsTable).values({ id, ...item }).returning();
    return result[0] as CatalogItem;
  }

  async addExpense(expense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const result = await db!.insert(expensesTable).values({
      id,
      ...expense,
    }).returning();
    
    const student = await this.getStudent(expense.studentId);
    if (student) {
      await this.updateStudentBudget(expense.studentId, student.budget - expense.amount);
    }
    
    return result[0] as Expense;
  }

  async getStudentExpenses(studentId: string): Promise<Expense[]> {
    return await db!.select().from(expensesTable).where(eq(expensesTable.studentId, studentId)) as Expense[];
  }

  async getAllExpenses(): Promise<Expense[]> {
    return await db!.select().from(expensesTable) as Expense[];
  }

  async getFixedExpenses(studentId: string): Promise<FixedExpense[]> {
    return await db!.select().from(fixedExpensesTable).where(eq(fixedExpensesTable.studentId, studentId)) as FixedExpense[];
  }

  async createFixedExpense(studentId: string, category: string, amount: number): Promise<FixedExpense> {
    const id = randomUUID();
    const result = await db!.insert(fixedExpensesTable).values({
      id,
      studentId,
      category,
      amount,
      isPaid: false,
      dueDate: new Date(),
    }).returning();
    return result[0] as FixedExpense;
  }

  async payFixedExpense(id: string): Promise<FixedExpense | undefined> {
    const result = await db!.update(fixedExpensesTable).set({ isPaid: true }).where(eq(fixedExpensesTable.id, id)).returning();
    return result[0] as FixedExpense | undefined;
  }

  async updateFixedExpenseAmount(expenseId: string, amount: number): Promise<FixedExpense | undefined> {
    const result = await db!.update(fixedExpensesTable).set({ amount }).where(eq(fixedExpensesTable.id, expenseId)).returning();
    return result[0] as FixedExpense | undefined;
  }

  async getDefaultExpenseAmounts(): Promise<Map<string, number>> {
    return new Map(Object.entries({
      "Loyer": 15, "Internet": 5, "Téléphone": 3, "Hydro": 8,
      "Assurance Voiture": 10, "Assurance Maison": 7, "Essence": 12,
      "Nourriture": 20, "Sortie": 5,
    }));
  }

  async setDefaultExpenseAmounts(_amounts: Map<string, number>): Promise<void> {}

  async updateAllStudentExpenseAmounts(amounts: Map<string, number>): Promise<void> {
    const expenses = await db!.select().from(fixedExpensesTable);
    for (const expense of expenses) {
      const newAmount = amounts.get(expense.category);
      if (newAmount !== undefined) {
        await db!.update(fixedExpensesTable).set({ amount: newAmount }).where(eq(fixedExpensesTable.id, expense.id));
      }
    }
  }

  async createBonusExpense(input: CreateBonusExpense, classId: string): Promise<BonusExpense> {
    const id = randomUUID();
    const result = await db!.insert(bonusExpensesTable).values({
      id,
      ...input,
      classId,
      isPaid: false,
    }).returning();
    
    const student = await this.getStudent(input.studentId);
    if (student) {
      await this.updateStudentBudget(input.studentId, student.budget - input.amount);
    }
    
    return result[0] as BonusExpense;
  }

  async getStudentBonusExpenses(studentId: string): Promise<BonusExpense[]> {
    return await db!.select().from(bonusExpensesTable).where(eq(bonusExpensesTable.studentId, studentId)) as BonusExpense[];
  }

  async payBonusExpense(id: string): Promise<BonusExpense | undefined> {
    const result = await db!.update(bonusExpensesTable).set({ isPaid: true }).where(eq(bonusExpensesTable.id, id)).returning();
    return result[0] as BonusExpense | undefined;
  }

  async deleteClassBonusExpenses(classId: string): Promise<void> {
    await db!.delete(bonusExpensesTable).where(eq(bonusExpensesTable.classId, classId));
  }
}
