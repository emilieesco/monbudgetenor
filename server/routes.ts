import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertExpenseSchema, updateBudgetSchema, insertCatalogItemSchema, createClassSchema, joinClassSchema, createBonusExpenseSchema, createChallengeSchema, createCustomChallengeSchema, createTeacherMessageSchema, createSurpriseEventSchema, createSnapshotSchema } from "@shared/schema";

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

  app.patch("/api/classes/:id/predefined-budget", async (req, res) => {
    try {
      const { predefinedBudget } = req.body;
      if (typeof predefinedBudget !== "number" || predefinedBudget <= 0) {
        return res.status(400).json({ error: "Invalid budget amount" });
      }
      const classData = await storage.updateClassPredefinedBudget(req.params.id, predefinedBudget);
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
      
      // Determine which expense amounts to use: custom (if provided) or class defaults
      const expenseAmounts = data.customExpenses || classData.expenseAmounts || {};
      
      // Check if student with same name already exists in this class
      const existingStudent = await storage.getStudentByNameAndClass(data.name, classData.id);
      if (existingStudent) {
        // Update the student's budget, custom expenses and add to history
        const updatedStudent = await storage.updateStudentBudgetWithHistory(existingStudent.id, data.budget);
        
        // Update custom expenses if provided
        if (data.customExpenses) {
          await storage.updateStudentCustomExpenses(existingStudent.id, data.customExpenses);
        }
        
        // Recreate challenges for the new budget
        const newChallenges = [
          { title: "Économe", description: "Dépense moins de 30% de ton budget", type: "spending" as const, target: Math.round(data.budget * 0.3) },
          { title: "Essentiel d'abord", description: "Achète 3 articles essentiels", type: "essential" as const, target: 3 },
          { title: "Responsable", description: "Paye toutes tes dépenses fixes", type: "fixed" as const, target: 100 },
          { title: "Sage", description: "Économise 50% de ton budget", type: "savings" as const, target: Math.round(data.budget * 0.5) },
        ];
        
        // Delete old challenges and create new ones
        await storage.deleteStudentChallenges(existingStudent.id);
        for (const ch of newChallenges) {
          await storage.createChallenge({
            studentId: existingStudent.id,
            title: ch.title,
            description: ch.description,
            type: ch.type,
            targetValue: ch.target,
          });
        }
        
        // Delete old fixed expenses and create new ones with custom or class amounts
        await storage.deleteStudentFixedExpenses(existingStudent.id);
        for (const [category, amount] of Object.entries(expenseAmounts)) {
          await storage.createFixedExpense(existingStudent.id, category, amount as number);
        }
        
        return res.json(updatedStudent || existingStudent);
      }
      
      const student = await storage.createStudent({
        name: data.name,
        classId: classData.id,
        budget: data.budget,
        scenario: data.scenario,
        customExpenses: data.customExpenses,
      });
      
      // Create default challenges
      const challenges = [
        { title: "Économe", description: "Dépense moins de 30% de ton budget", type: "spending" as const, target: Math.round(data.budget * 0.3) },
        { title: "Essentiel d'abord", description: "Achète 3 articles essentiels", type: "essential" as const, target: 3 },
        { title: "Responsable", description: "Paye toutes tes dépenses fixes", type: "fixed" as const, target: 100 },
        { title: "Sage", description: "Économise 50% de ton budget", type: "savings" as const, target: Math.round(data.budget * 0.5) },
      ];
      
      for (const ch of challenges) {
        await storage.createChallenge({
          studentId: student.id,
          title: ch.title,
          description: ch.description,
          type: ch.type,
          targetValue: ch.target,
        });
      }
      
      // Create fixed expenses with custom or class amounts
      for (const [category, amount] of Object.entries(expenseAmounts)) {
        await storage.createFixedExpense(student.id, category, amount as number);
      }
      
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

  app.post("/api/students/:id/new-month", async (req, res) => {
    try {
      const student = await storage.startNewMonth(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to start new month" });
    }
  });

  app.post("/api/students/:id/manual-expense", async (req, res) => {
    try {
      const { name, amount, category } = req.body;
      if (!name || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid expense data" });
      }
      
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      const expense = await storage.addExpense({
        studentId: req.params.id,
        itemId: `manual-${Date.now()}`,
        amount: parseFloat(amount),
        category: category || "leisure",
        isEssential: false,
        feedback: "warning",
        message: `Dépense manuelle: ${name}`,
      });
      
      const newBudget = student.budget - parseFloat(amount);
      const newSpent = student.spent + parseFloat(amount);
      await storage.updateStudentBudgetAndSpent(req.params.id, newBudget, newSpent);
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to add manual expense" });
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
      const parsed = insertExpenseSchema.parse(req.body);
      
      // Generate feedback and message if not provided
      const feedback = parsed.feedback || (parsed.isEssential ? "success" : "warning");
      const message = parsed.message || (parsed.isEssential 
        ? "Bon choix! C'est un achat essentiel." 
        : "Attention, ceci n'est pas un achat essentiel.");
      
      const data = { ...parsed, feedback, message };
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
        const newBudget = student.budget - expense.amount;
        await storage.updateStudentBudgetAndSpent(expense.studentId, newBudget, newSpent);
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

  // Challenge endpoints
  app.post("/api/challenges", async (req, res) => {
    try {
      const data = createChallengeSchema.parse(req.body);
      const challenge = await storage.createChallenge(data);
      res.json(challenge);
    } catch (error) {
      res.status(400).json({ error: "Invalid challenge data" });
    }
  });

  app.get("/api/challenges/:studentId", async (req, res) => {
    try {
      const challenges = await storage.getStudentChallenges(req.params.studentId);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.patch("/api/challenges/:id/complete", async (req, res) => {
    try {
      const challenge = await storage.completeChallenge(req.params.id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete challenge" });
    }
  });

  // Savings endpoints
  app.patch("/api/students/:id/savings", async (req, res) => {
    try {
      const { amount } = req.body;
      if (amount === undefined || amount < 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      const newSavings = student.savings + amount;
      const updated = await storage.updateStudentSavings(req.params.id, newSavings);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update savings" });
    }
  });

  app.patch("/api/students/:id/withdraw", async (req, res) => {
    try {
      const { amount } = req.body;
      if (amount === undefined || amount < 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      if (student.savings < amount) {
        return res.status(400).json({ error: "Insufficient savings" });
      }
      const newSavings = student.savings - amount;
      const updated = await storage.updateStudentSavings(req.params.id, newSavings);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to withdraw savings" });
    }
  });

  // Custom Challenge endpoints
  app.post("/api/custom-challenges", async (req, res) => {
    try {
      const data = createCustomChallengeSchema.parse(req.body);
      const challenge = await storage.createCustomChallenge(data);
      res.json(challenge);
    } catch (error) {
      res.status(400).json({ error: "Invalid challenge data" });
    }
  });

  app.get("/api/custom-challenges/:classId", async (req, res) => {
    try {
      const challenges = await storage.getClassCustomChallenges(req.params.classId);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.patch("/api/custom-challenges/:id/complete", async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "studentId required" });
      }
      const challenge = await storage.completeCustomChallenge(req.params.id, studentId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete challenge" });
    }
  });

  // Teacher Message endpoints
  app.post("/api/messages", async (req, res) => {
    try {
      const data = createTeacherMessageSchema.parse(req.body);
      const message = await storage.createTeacherMessage(data);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.get("/api/messages/class/:classId", async (req, res) => {
    try {
      const messages = await storage.getClassMessages(req.params.classId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/student/:studentId", async (req, res) => {
    try {
      const messages = await storage.getStudentMessages(req.params.studentId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Surprise Event endpoints
  app.post("/api/surprise-events", async (req, res) => {
    try {
      const data = createSurpriseEventSchema.parse(req.body);
      const event = await storage.createSurpriseEvent(data);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.get("/api/surprise-events/:classId", async (req, res) => {
    try {
      const events = await storage.getClassSurpriseEvents(req.params.classId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.patch("/api/surprise-events/:id/apply", async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "studentId required" });
      }
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      const event = await storage.applyStudentSurpriseEvent(req.params.id, studentId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      // Apply event to student budget
      let newBudget = student.budget;
      if (event.type === "bonus_salary") {
        newBudget += event.amount;
      } else if (event.type === "emergency_expense") {
        newBudget -= event.amount;
      }
      // For promo, reduce price in catalog later
      await storage.updateStudentBudget(studentId, newBudget);
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to apply event" });
    }
  });

  // Budget Snapshot endpoints
  app.post("/api/students/:id/snapshots", async (req, res) => {
    try {
      const data = createSnapshotSchema.parse(req.body);
      const snapshot = await storage.createSnapshot(req.params.id, data.label);
      res.json(snapshot);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Erreur lors de la sauvegarde" });
    }
  });

  app.get("/api/students/:id/snapshots", async (req, res) => {
    try {
      const snapshots = await storage.getStudentSnapshots(req.params.id);
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des sauvegardes" });
    }
  });

  app.post("/api/snapshots/:id/restore", async (req, res) => {
    try {
      const student = await storage.restoreSnapshot(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Sauvegarde introuvable" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la restauration" });
    }
  });

  app.delete("/api/snapshots/:id", async (req, res) => {
    try {
      const result = await storage.deleteSnapshot(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Sauvegarde introuvable" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  app.post("/api/classes/:id/new-month", async (req, res) => {
    try {
      const classData = await storage.getClass(req.params.id);
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }
      
      const students = await storage.getClassStudents(req.params.id);
      const updatedStudents = [];
      
      for (const student of students) {
        const updated = await storage.startNewMonth(student.id);
        if (updated) {
          updatedStudents.push(updated);
        }
      }
      
      res.json({ 
        success: true, 
        studentsUpdated: updatedStudents.length,
        students: updatedStudents 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start new month for class" });
    }
  });

  return httpServer;
}
