import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertExpenseSchema, updateBudgetSchema, insertCatalogItemSchema, createClassSchema, joinClassSchema, createBonusExpenseSchema, createChallengeSchema, createCustomChallengeSchema, createTeacherMessageSchema, createSurpriseEventSchema, createSnapshotSchema, createSavingsGoalSchema, createClassChallengeSchema, BADGE_DEFINITIONS, BADGE_TIER_THRESHOLDS, BadgeTier } from "@shared/schema";

// Helper to get tier rank for comparison
function getTierRank(tier: BadgeTier): number {
  const ranks: Record<BadgeTier, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
  return ranks[tier];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Class endpoints
  app.post("/api/classes", async (req, res) => {
    try {
      const { inviteCode, ...rest } = req.body;
      // If an invite code is provided, validate and consume it atomically
      if (inviteCode) {
        const invite = await storage.validateTeacherInvite(String(inviteCode).trim().toUpperCase());
        if (!invite) {
          return res.status(403).json({ error: "Code d'invitation invalide ou déjà utilisé" });
        }
        // Create the class first
        const data = createClassSchema.parse(rest);
        const classData = await storage.createClass(data);
        // Only consume the invite after successful class creation
        await storage.useTeacherInvite(invite.code);
        return res.json(classData);
      }
      // No invite code — check if invites feature is disabled (for backward compat)
      const data = createClassSchema.parse(rest);
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
        const newChallenges = [
          { title: "Économe", description: "Dépense moins de 30% de ton budget", type: "spending" as const, target: Math.round(data.budget * 0.3) },
          { title: "Essentiel d'abord", description: "Achète 3 articles essentiels", type: "essential" as const, target: 3 },
          { title: "Responsable", description: "Paye toutes tes dépenses fixes", type: "fixed" as const, target: 100 },
          { title: "Sage", description: "Économise 50% de ton budget", type: "savings" as const, target: Math.round(data.budget * 0.5) },
        ];

        // Run budget update, custom expenses update, and deletes all in parallel
        const [updatedStudent] = await Promise.all([
          storage.updateStudentBudgetWithHistory(existingStudent.id, data.budget),
          data.customExpenses ? storage.updateStudentCustomExpenses(existingStudent.id, data.customExpenses) : Promise.resolve(),
          storage.deleteStudentChallenges(existingStudent.id),
          storage.deleteStudentFixedExpenses(existingStudent.id),
        ]);

        // Now create all challenges + fixed expenses in parallel
        await Promise.all([
          ...newChallenges.map(ch => storage.createChallenge({
            studentId: existingStudent.id,
            title: ch.title,
            description: ch.description,
            type: ch.type,
            targetValue: ch.target,
          })),
          ...Object.entries(expenseAmounts).map(([category, amount]) =>
            storage.createFixedExpense(existingStudent.id, category, amount as number)
          ),
        ]);

        return res.json(updatedStudent || existingStudent);
      }

      // Vérifier la limite de 25 élèves par classe
      const existingStudents = await storage.getClassStudents(classData.id);
      if (existingStudents.length >= 25) {
        return res.status(400).json({ error: "Cette classe est complète (maximum 25 élèves)." });
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
      
      // Create all challenges and fixed expenses in parallel (single round-trip latency)
      await Promise.all([
        ...challenges.map(ch => storage.createChallenge({
          studentId: student.id,
          title: ch.title,
          description: ch.description,
          type: ch.type,
          targetValue: ch.target,
        })),
        ...Object.entries(expenseAmounts).map(([category, amount]) =>
          storage.createFixedExpense(student.id, category, amount as number)
        ),
      ]);
      
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

  // Clear budget history (essais)
  app.delete("/api/students/:id/budget-history", async (req, res) => {
    try {
      const student = await storage.clearStudentBudgetHistory(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Étudiant introuvable" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'historique" });
    }
  });

  // Reset student budget completely (new budget, clear spent/savings, reset history)
  app.post("/api/students/:id/reset-budget", async (req, res) => {
    try {
      const { budget } = updateBudgetSchema.parse(req.body);
      const student = await storage.resetStudentBudget(req.params.id, budget);
      if (!student) {
        return res.status(404).json({ error: "Étudiant introuvable" });
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Données invalides" });
    }
  });

  // Full reset: month 1, original budget, no purchases, fixed expenses recreated, badges cleared
  app.post("/api/students/:id/full-reset", async (req, res) => {
    try {
      const student = await storage.fullResetStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Étudiant introuvable" });
      }
      res.json(student);
    } catch (error) {
      console.error("Full reset error:", error);
      res.status(500).json({ error: "Erreur lors de la réinitialisation" });
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
      
      // Create as bonus expense with extended categories
      const bonusExpense = await storage.createBonusExpense({
        studentId: req.params.id,
        title: name,
        description: `Dépense ajoutée par l'enseignant`,
        amount: parseFloat(amount),
        category: category || "other",
      }, student.classId);
      
      res.json(bonusExpense);
    } catch (error) {
      res.status(500).json({ error: "Failed to add manual expense" });
    }
  });

  // Delete expense (catalog purchase)
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Dépense introuvable" });
      }
      res.json({ success: true, message: "Dépense supprimée et budget remboursé" });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la dépense" });
    }
  });

  // Delete all expenses for a student
  app.delete("/api/students/:id/expenses", async (req, res) => {
    try {
      await storage.deleteStudentExpenses(req.params.id);
      res.json({ success: true, message: "Toutes les dépenses ont été supprimées" });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression des dépenses" });
    }
  });

  // Delete bonus expense
  app.delete("/api/bonus-expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBonusExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Dépense bonus introuvable" });
      }
      res.json({ success: true, message: "Dépense bonus supprimée et budget remboursé" });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la dépense bonus" });
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
      
      // Add bonus amount directly to student's budget
      const student = await storage.getStudent(bonus.studentId);
      if (student) {
        const newBudget = student.budget + bonus.amount;
        await storage.updateStudentBudget(bonus.studentId, newBudget);
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
      
      // Only add to spent - do NOT reduce budget (that would double-count)
      // Budget stays fixed, spent increases, remaining = budget - spent
      const student = await storage.getStudent(expense.studentId);
      if (student) {
        const newSpent = student.spent + expense.amount;
        // Keep budget the same - only update spent
        await storage.updateStudentBudgetAndSpent(expense.studentId, student.budget, newSpent);
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

  app.post("/api/fixed-expenses/:studentId/custom", async (req, res) => {
    try {
      const { name, amount } = req.body;
      if (!name || !amount || amount <= 0) {
        return res.status(400).json({ error: "name et amount requis" });
      }
      const expense = await storage.createCustomFixedExpense(req.params.studentId, name, Number(amount));
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to create custom expense" });
    }
  });

  app.delete("/api/fixed-expenses/:id/custom", async (req, res) => {
    try {
      const ok = await storage.deleteFixedExpense(req.params.id);
      if (!ok) return res.status(404).json({ error: "Expense not found or not custom" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete custom expense" });
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
      const student = await storage.getStudent(req.params.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });
      const messages = await storage.getStudentMessages(req.params.studentId, student.classId);
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

  app.get("/api/students/:studentId/applied-events", async (req, res) => {
    try {
      const events = await storage.getStudentAppliedEvents(req.params.studentId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applied events" });
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
      
      const results = await Promise.all(
        students.map(async student => {
          let newBudget = student.budget;
          if (event.type === "bonus_salary") newBudget += event.amount;
          else if (event.type === "emergency_expense") newBudget -= event.amount;
          await Promise.all([
            storage.updateStudentBudget(student.id, newBudget),
            storage.applyStudentSurpriseEvent(req.params.id, student.id),
          ]);
          return { studentId: student.id, studentName: student.name, newBudget };
        })
      );
      
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
      const results = await Promise.all(students.map(s => storage.startNewMonth(s.id)));
      const updatedStudents = results.filter(Boolean);
      
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

  // Get all bonus expenses for a class (for teacher history management)
  app.get("/api/classes/:id/bonus-expenses", async (req, res) => {
    try {
      const students = await storage.getClassStudents(req.params.id);
      const perStudent = await Promise.all(
        students.map(async student => {
          const expenses = await storage.getStudentBonusExpenses(student.id);
          return expenses.map(exp => ({ ...exp, studentName: student.name }));
        })
      );
      const allExpenses = perStudent.flat().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json(allExpenses);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des dépenses" });
    }
  });

  // Get all catalog expenses for a class (for teacher history management)
  app.get("/api/classes/:id/expenses", async (req, res) => {
    try {
      const students = await storage.getClassStudents(req.params.id);
      const perStudent = await Promise.all(
        students.map(async student => {
          const expenses = await storage.getStudentExpenses(student.id);
          return expenses.map(exp => ({ ...exp, studentName: student.name }));
        })
      );
      const allExpenses = perStudent.flat().sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      res.json(allExpenses);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des dépenses" });
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
      const challenges = await storage.getStudentChallenges(req.params.id);
      const completedChallenges = challenges.filter(c => c.completed).length;
      const awardedBadges: any[] = [];

      // Helper to determine tier based on thresholds
      const getTier = (value: number, thresholds: { bronze: number; silver: number; gold: number; platinum: number }): "bronze" | "silver" | "gold" | "platinum" | null => {
        if (value >= thresholds.platinum) return "platinum";
        if (value >= thresholds.gold) return "gold";
        if (value >= thresholds.silver) return "silver";
        if (value >= thresholds.bronze) return "bronze";
        return null;
      };

      // Check for first purchase (always bronze tier)
      if (expenses.length >= 1) {
        const hasBadge = await storage.hasStudentBadge(req.params.id, "first_purchase");
        if (!hasBadge) {
          const badge = await storage.awardBadge(req.params.id, "first_purchase", "bronze");
          awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.first_purchase, tier: "bronze" });
        }
      }

      // Check for saver badge (tiered based on savings)
      const saverTier = getTier(student.savings, BADGE_TIER_THRESHOLDS.saver);
      if (saverTier) {
        const existingBadge = await storage.getStudentBadgeByType(req.params.id, "saver");
        if (!existingBadge || (existingBadge && getTierRank(saverTier) > getTierRank(existingBadge.tier))) {
          const badge = await storage.awardBadge(req.params.id, "saver", saverTier);
          awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.saver, tier: saverTier });
        }
      }

      // Check for essential master (tiered based on percentage)
      if (expenses.length >= 5) {
        const essentialCount = expenses.filter(e => e.isEssential).length;
        const ratio = (essentialCount / expenses.length) * 100;
        const essentialTier = getTier(ratio, BADGE_TIER_THRESHOLDS.essential_master);
        if (essentialTier) {
          const existingBadge = await storage.getStudentBadgeByType(req.params.id, "essential_master");
          if (!existingBadge || (existingBadge && getTierRank(essentialTier) > getTierRank(existingBadge.tier))) {
            const badge = await storage.awardBadge(req.params.id, "essential_master", essentialTier);
            awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.essential_master, tier: essentialTier });
          }
        }
      }

      // Check for challenge complete badge (tiered based on count)
      if (completedChallenges >= 1) {
        const challengeTier = getTier(completedChallenges, BADGE_TIER_THRESHOLDS.challenge_complete);
        if (challengeTier) {
          const existingBadge = await storage.getStudentBadgeByType(req.params.id, "challenge_complete");
          if (!existingBadge || (existingBadge && getTierRank(challengeTier) > getTierRank(existingBadge.tier))) {
            const badge = await storage.awardBadge(req.params.id, "challenge_complete", challengeTier);
            awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.challenge_complete, tier: challengeTier });
          }
        }
      }

      // Check for monthly survivor (tiered based on months survived)
      const allPaid = fixedExpenses.every(e => e.isPaid);
      const currentMonth = student.currentMonth || 1;
      if (allPaid && fixedExpenses.length > 0) {
        const survivorTier = getTier(currentMonth, BADGE_TIER_THRESHOLDS.monthly_survivor);
        if (survivorTier) {
          const existingBadge = await storage.getStudentBadgeByType(req.params.id, "monthly_survivor");
          if (!existingBadge || (existingBadge && getTierRank(survivorTier) > getTierRank(existingBadge.tier))) {
            const badge = await storage.awardBadge(req.params.id, "monthly_survivor", survivorTier);
            awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.monthly_survivor, tier: survivorTier });
          }
        }
      }

      // Check for budget hero (tiered based on budget remaining percentage)
      const remaining = student.budget - student.spent;
      const remainingPercent = (remaining / student.budget) * 100;
      if (remaining > 0) {
        const heroTier = getTier(remainingPercent, BADGE_TIER_THRESHOLDS.budget_hero);
        if (heroTier) {
          const existingBadge = await storage.getStudentBadgeByType(req.params.id, "budget_hero");
          if (!existingBadge || (existingBadge && getTierRank(heroTier) > getTierRank(existingBadge.tier))) {
            const badge = await storage.awardBadge(req.params.id, "budget_hero", heroTier);
            awardedBadges.push({ ...badge, ...BADGE_DEFINITIONS.budget_hero, tier: heroTier });
          }
        }
      }

      res.json({ awardedBadges });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la vérification des badges" });
    }
  });

  // Admin middleware helper (async — reads password from DB)
  async function checkAdminPassword(req: any, res: any): Promise<boolean> {
    const pwd = req.body?.adminPassword || req.query?.adminPassword;
    const ADMIN_PASSWORD = await storage.getAdminPassword();
    if (pwd !== ADMIN_PASSWORD) {
      res.status(401).json({ error: "Mot de passe administrateur invalide" });
      return false;
    }
    return true;
  }

  // Admin: verify password
  app.post("/api/admin/verify", async (req, res) => {
    if (await checkAdminPassword(req, res)) {
      res.json({ ok: true });
    }
  });

  // Admin: list all teacher invite codes
  app.get("/api/admin/teacher-invites", async (req, res) => {
    if (!await checkAdminPassword(req, res)) return;
    try {
      const invites = await storage.getTeacherInvites();
      res.json(invites);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Admin: create a new invite code
  app.post("/api/admin/teacher-invites", async (req, res) => {
    if (!await checkAdminPassword(req, res)) return;
    try {
      const { note } = req.body;
      const invite = await storage.createTeacherInvite(note);
      res.json(invite);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Admin: delete an invite code
  app.delete("/api/admin/teacher-invites/:id", async (req, res) => {
    if (!await checkAdminPassword(req, res)) return;
    try {
      const deleted = await storage.deleteTeacherInvite(req.params.id);
      res.json({ deleted });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Public: validate a teacher invite code (does not consume it)
  app.post("/api/teacher-invites/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Code requis" });
      const invite = await storage.validateTeacherInvite(code.trim().toUpperCase());
      if (!invite) return res.status(404).json({ error: "Code invalide ou déjà utilisé" });
      res.json({ valid: true, invite });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Public: consume invite code (when creating a class)
  app.post("/api/teacher-invites/use", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Code requis" });
      const ok = await storage.useTeacherInvite(code.trim().toUpperCase());
      if (!ok) return res.status(404).json({ error: "Code invalide ou déjà utilisé" });
      res.json({ used: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  return httpServer;
}
