import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertExpenseSchema, updateBudgetSchema, insertCatalogItemSchema, createClassSchema, joinClassSchema, createBonusExpenseSchema, createChallengeSchema, createCustomChallengeSchema, createTeacherMessageSchema, createSurpriseEventSchema, createSnapshotSchema, createSavingsGoalSchema, createClassChallengeSchema, BADGE_DEFINITIONS } from "@shared/schema";

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

  // Apply surprise event to ALL students in the class
  app.patch("/api/surprise-events/:id/apply-all", async (req, res) => {
    try {
      const event = await storage.getSurpriseEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const students = await storage.getClassStudents(event.classId);
      if (students.length === 0) {
        return res.status(400).json({ error: "No students in class" });
      }
      
      const results = [];
      for (const student of students) {
        // Apply event to student budget
        let newBudget = student.budget;
        if (event.type === "bonus_salary") {
          newBudget += event.amount;
        } else if (event.type === "emergency_expense") {
          newBudget -= event.amount;
        }
        await storage.updateStudentBudget(student.id, newBudget);
        await storage.applyStudentSurpriseEvent(req.params.id, student.id);
        results.push({ studentId: student.id, studentName: student.name, newBudget });
      }
      
      res.json({ 
        event, 
        appliedTo: results.length, 
        students: results 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to apply event to all students" });
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

  // ============ GAMIFICATION ENDPOINTS ============

  // Badge endpoints
  app.get("/api/students/:id/badges", async (req, res) => {
    try {
      const badges = await storage.getStudentBadges(req.params.id);
      const enrichedBadges = badges.map(badge => ({
        ...badge,
        ...BADGE_DEFINITIONS[badge.type],
      }));
      res.json(enrichedBadges);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des badges" });
    }
  });

  app.post("/api/students/:id/badges", async (req, res) => {
    try {
      const { type } = req.body;
      if (!type || !BADGE_DEFINITIONS[type as keyof typeof BADGE_DEFINITIONS]) {
        return res.status(400).json({ error: "Type de badge invalide" });
      }
      const badge = await storage.awardBadge(req.params.id, type);
      res.json({ ...badge, ...BADGE_DEFINITIONS[badge.type] });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'attribution du badge" });
    }
  });

  app.get("/api/badge-definitions", async (req, res) => {
    res.json(BADGE_DEFINITIONS);
  });

  // Savings Goals endpoints
  app.get("/api/students/:id/savings-goals", async (req, res) => {
    try {
      const goals = await storage.getStudentSavingsGoals(req.params.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des objectifs" });
    }
  });

  app.post("/api/savings-goals", async (req, res) => {
    try {
      const data = createSavingsGoalSchema.parse(req.body);
      const goal = await storage.createSavingsGoal(data);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ error: "Données d'objectif invalides" });
    }
  });

  app.patch("/api/savings-goals/:id/progress", async (req, res) => {
    try {
      const { currentAmount } = req.body;
      if (typeof currentAmount !== "number") {
        return res.status(400).json({ error: "Montant invalide" });
      }
      const goal = await storage.updateSavingsGoalProgress(req.params.id, currentAmount);
      if (!goal) {
        return res.status(404).json({ error: "Objectif introuvable" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  app.delete("/api/savings-goals/:id", async (req, res) => {
    try {
      const result = await storage.deleteSavingsGoal(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Objectif introuvable" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // Class Challenges endpoints
  app.get("/api/classes/:id/challenges", async (req, res) => {
    try {
      const challenges = await storage.getClassChallenges(req.params.id);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des défis" });
    }
  });

  app.post("/api/class-challenges", async (req, res) => {
    try {
      const data = createClassChallengeSchema.parse(req.body);
      const challenge = await storage.createClassChallenge(data);
      res.json(challenge);
    } catch (error) {
      res.status(400).json({ error: "Données de défi invalides" });
    }
  });

  app.patch("/api/class-challenges/:id/complete", async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "ID étudiant requis" });
      }
      const challenge = await storage.completeClassChallenge(req.params.id, studentId);
      if (!challenge) {
        return res.status(404).json({ error: "Défi introuvable" });
      }
      
      // Award challenge complete badge
      await storage.awardBadge(studentId, "challenge_complete");
      
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la complétion" });
    }
  });

  app.delete("/api/class-challenges/:id", async (req, res) => {
    try {
      const result = await storage.deleteClassChallenge(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Défi introuvable" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // Leaderboard endpoint
  app.get("/api/classes/:id/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getClassLeaderboard(req.params.id);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération du classement" });
    }
  });

  // Auto-check badges for student (called after purchases, etc.)
  app.post("/api/students/:id/check-badges", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Étudiant introuvable" });
      }

      const expenses = await storage.getStudentExpenses(req.params.id);
      const fixedExpenses = await storage.getFixedExpenses(req.params.id);
      const awardedBadges = [];

      // Check for first purchase
      if (expenses.length >= 1) {
        const hasBadge = await storage.hasStudentBadge(req.params.id, "first_purchase");
        if (!hasBadge) {
          const badge = await storage.awardBadge(req.params.id, "first_purchase");
          awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.first_purchase });
        }
      }

      // Check for saver badge (100$ or more in savings)
      if (student.savings >= 100) {
        const hasBadge = await storage.hasStudentBadge(req.params.id, "saver");
        if (!hasBadge) {
          const badge = await storage.awardBadge(req.params.id, "saver");
          awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.saver });
        }
      }

      // Check for essential master (80% essential purchases)
      if (expenses.length >= 5) {
        const essentialCount = expenses.filter(e => e.isEssential).length;
        const ratio = essentialCount / expenses.length;
        if (ratio >= 0.8) {
          const hasBadge = await storage.hasStudentBadge(req.params.id, "essential_master");
          if (!hasBadge) {
            const badge = await storage.awardBadge(req.params.id, "essential_master");
            awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.essential_master });
          }
        }
      }

      // Check for monthly survivor (all fixed expenses paid)
      const allPaid = fixedExpenses.every(e => e.isPaid);
      if (allPaid && fixedExpenses.length > 0) {
        const hasBadge = await storage.hasStudentBadge(req.params.id, "monthly_survivor");
        if (!hasBadge) {
          const badge = await storage.awardBadge(req.params.id, "monthly_survivor");
          awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.monthly_survivor });
        }
      }

      // Check for budget hero (positive budget at end of context)
      if (student.budget > 0 && student.spent > 0) {
        const hasBadge = await storage.hasStudentBadge(req.params.id, "budget_hero");
        if (!hasBadge) {
          const badge = await storage.awardBadge(req.params.id, "budget_hero");
          awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.budget_hero });
        }
      }

      res.json({ awardedBadges });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la vérification des badges" });
    }
  });

  return httpServer;
}
