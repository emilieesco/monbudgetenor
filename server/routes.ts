import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertExpenseSchema, updateBudgetSchema, insertCatalogItemSchema, createClassSchema, joinClassSchema, createBonusExpenseSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Class endpoints
  app.post("/api/classes", async (req, res) => {
    try {
      const data = createClassSchema.parse(req.body);
      const classData = await storage.createClass(data);
      res.json(classData);
    } catch (error) {
      res.status(400).json({ error: "Invalid class data" });
    }
  });

  app.get("/api/classes/:id", async (req, res) => {
    try {
      const classData = await storage.getClass(req.params.id);
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }
      res.json(classData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class" });
    }
  });

  app.get("/api/classes/code/:code", async (req, res) => {
    try {
      const classData = await storage.getClassByCode(req.params.code);
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }
      res.json(classData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class" });
    }
  });

  app.get("/api/classes/:id/students", async (req, res) => {
    try {
      const students = await storage.getClassStudents(req.params.id);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.patch("/api/classes/:id/expenses", async (req, res) => {
    try {
      const amounts = new Map(Object.entries(req.body));
      const classData = await storage.updateClassExpenseAmounts(req.params.id, amounts);
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }
      res.json(classData);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Student endpoints
  app.post("/api/students/join", async (req, res) => {
    try {
      const data = joinClassSchema.parse(req.body);
      const classData = await storage.getClassByCode(data.classCode);
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }
      const student = await storage.createStudent({
        name: data.name,
        classId: classData.id,
        budget: 50,
      });
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Invalid student data" });
    }
  });

  // Student endpoints
  app.get("/api/students", async (_req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const data = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(data);
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Invalid student data" });
    }
  });

  app.get("/api/students/class/:classId", async (req, res) => {
    try {
      const students = await storage.getClassStudents(req.params.classId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.patch("/api/students/:id/budget", async (req, res) => {
    try {
      const { budget } = updateBudgetSchema.parse(req.body);
      const student = await storage.updateStudentBudget(req.params.id, budget);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Invalid budget data" });
    }
  });

  // Catalog endpoints
  app.get("/api/catalog", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const items = await storage.getCatalogItems(category);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch catalog" });
    }
  });

  app.get("/api/catalog/:id", async (req, res) => {
    try {
      const item = await storage.getCatalogItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  app.post("/api/catalog", async (req, res) => {
    try {
      const data = insertCatalogItemSchema.parse(req.body);
      const item = await storage.createCatalogItem(data);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid catalog item data" });
    }
  });

  // Expense endpoints
  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.addExpense(data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  app.get("/api/expenses/:studentId", async (req, res) => {
    try {
      const expenses = await storage.getStudentExpenses(req.params.studentId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  // Fixed expenses endpoints
  app.get("/api/fixed-expenses/:studentId", async (req, res) => {
    try {
      const expenses = await storage.getFixedExpenses(req.params.studentId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fixed expenses" });
    }
  });

  // Bonus expenses endpoints
  app.post("/api/bonus-expenses", async (req, res) => {
    try {
      const data = createBonusExpenseSchema.parse(req.body);
      const classId = req.body.classId;
      if (!classId) {
        return res.status(400).json({ error: "classId required" });
      }
      const bonus = await storage.createBonusExpense(data, classId);
      res.json(bonus);
    } catch (error) {
      res.status(400).json({ error: "Invalid bonus expense data" });
    }
  });

  app.get("/api/bonus-expenses/:studentId", async (req, res) => {
    try {
      const expenses = await storage.getStudentBonusExpenses(req.params.studentId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bonus expenses" });
    }
  });

  app.patch("/api/bonus-expenses/:id/pay", async (req, res) => {
    try {
      const bonus = await storage.payBonusExpense(req.params.id);
      if (!bonus) {
        return res.status(404).json({ error: "Bonus not found" });
      }
      res.json(bonus);
    } catch (error) {
      res.status(500).json({ error: "Failed to pay bonus" });
    }
  });

  app.patch("/api/fixed-expenses/:id/pay", async (req, res) => {
    try {
      const expense = await storage.payFixedExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      // Deduct from student budget and add to spent
      const student = await storage.getStudent(expense.studentId);
      if (student) {
        const newSpent = student.spent + expense.amount;
        await storage.updateStudentBudget(expense.studentId, student.budget - expense.amount);
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to pay expense" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/default-expenses", async (_req, res) => {
    try {
      const amounts = await storage.getDefaultExpenseAmounts();
      res.json(Object.fromEntries(amounts));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default expenses" });
    }
  });

  app.patch("/api/admin/default-expenses", async (req, res) => {
    try {
      const amounts = new Map(Object.entries(req.body));
      await storage.setDefaultExpenseAmounts(amounts);
      res.json(Object.fromEntries(amounts));
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/fixed-expenses/:id/amount", async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const expense = await storage.updateFixedExpenseAmount(req.params.id, amount);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  return httpServer;
}
