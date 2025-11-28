import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import type { Class, Student } from "@shared/schema";

function AddBonusExpenseForm({ classId, students }: { classId: string; students: Student[] }) {
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const createBonusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bonus-expenses", {
        studentId,
        title,
        description,
        amount: parseFloat(amount),
        classId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-expenses"] });
      setStudentId("");
      setTitle("");
      setDescription("");
      setAmount("");
      alert("Dépense surprise créée!");
    },
  });

  const handleSubmit = () => {
    if (!studentId || !title || !description || !amount) {
      alert("Tous les champs sont requis");
      return;
    }
    createBonusMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="student">Élève</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger data-testid="select-student">
            <SelectValue placeholder="Sélectionner un élève" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          placeholder="Ex: Accident voiture, Impôts tardifs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="input-bonus-title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Décrivez la dépense surprise..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="input-bonus-description"
        />
      </div>

      <div>
        <Label htmlFor="amount">Montant ($)</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          data-testid="input-bonus-amount"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={createBonusMutation.isPending || !studentId || !title || !description || !amount}
        className="w-full bg-destructive hover:bg-destructive/90 flex items-center justify-center gap-2"
        size="lg"
        data-testid="button-add-bonus"
      >
        <AlertCircle className="w-5 h-5" />
        {createBonusMutation.isPending ? "Création..." : "Ajouter Dépense Surprise"}
      </Button>
    </div>
  );
}

interface ExpenseAmount {
  [key: string]: number;
}

interface AdminParams {
  classId: string;
}

export default function Admin({ classId }: AdminParams) {
  const [_location, navigate] = useLocation();
  const [expenseAmounts, setExpenseAmounts] = useState<ExpenseAmount>({});
  const [initialized, setInitialized] = useState(false);

  // Extract classId from URL if not provided as prop
  const actualClassId = typeof window !== 'undefined' && !classId 
    ? window.location.pathname.split('/').pop() 
    : classId;

  const classQuery = useQuery({
    queryKey: ["/api/classes", actualClassId],
    enabled: !!actualClassId,
  });

  const studentsQuery = useQuery({
    queryKey: ["/api/classes", actualClassId, "students"],
    enabled: !!actualClassId,
  });

  const updateExpensesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/classes/${actualClassId}/expenses`, expenseAmounts);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", actualClassId] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", actualClassId, "students"] });
      alert("Montants des dépenses mis à jour avec succès!");
    },
  });

  const classData = classQuery.data as Class | undefined;
  const students = studentsQuery.data as Student[] || [];

  // Initialize expenseAmounts from classData
  useEffect(() => {
    if (classData && !initialized) {
      setExpenseAmounts(classData.expenseAmounts || {});
      setInitialized(true);
    }
  }, [classData, initialized]);

  if (!actualClassId || classQuery.isLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!classData) {
    return <div className="p-8 text-center text-destructive">Classe introuvable</div>;
  }

  const expensesToEdit = Object.keys(expenseAmounts).length > 0 ? expenseAmounts : classData.expenseAmounts || {};

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary">Classe: {classData.code}</h1>
            <p className="text-muted-foreground">Enseignant: {classData.teacherName}</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Button>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <p className="text-sm font-semibold text-foreground">
            Modifiez les montants des dépenses fixes pour les élèves de cette classe ({students.length} élève{students.length > 1 ? 's' : ''})
          </p>
        </Card>

        {/* Expenses Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Dépenses Fixes</h2>
          
          <div className="space-y-4">
            {Object.entries(expensesToEdit).map(([category, amount]) => (
              <div key={category} className="flex items-end gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-semibold">{category}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => {
                      setExpenseAmounts(prev => ({
                        ...prev,
                        [category]: parseFloat(e.target.value) || 0
                      }));
                    }}
                    className="mt-2"
                    data-testid={`input-expense-${category.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                </div>
                <span className="text-lg font-bold text-primary">${amount}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Mensuel</span>
              <span className="text-2xl font-bold text-primary">
                ${Object.values(expensesToEdit).reduce((sum, val) => sum + val, 0)}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={() => updateExpensesMutation.mutate()}
            disabled={updateExpensesMutation.isPending}
            className="w-full mt-8 bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
            size="lg"
            data-testid="button-save-expenses"
          >
            <Save className="w-5 h-5" />
            {updateExpensesMutation.isPending ? "Enregistrement..." : "Enregistrer les Montants"}
          </Button>
        </Card>

        {/* Add Bonus Expense */}
        <Card className="p-8 mt-8">
          <h3 className="text-2xl font-bold mb-6">Ajouter une Dépense Surprise</h3>
          <AddBonusExpenseForm classId={actualClassId} students={students} />
        </Card>

        {/* Students List */}
        {students.length > 0 && (
          <Card className="p-6 mt-8">
            <h3 className="font-semibold mb-4">Élèves de la classe ({students.length})</h3>
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{student.name}</span>
                  <span className="text-sm text-muted-foreground">Budget: ${student.budget}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-8 bg-muted/50">
          <h3 className="font-semibold mb-2">Comment ça fonctionne</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Modifiez les montants des dépenses fixes</li>
            <li>• Cliquez sur "Enregistrer" pour appliquer les changements</li>
            <li>• Tous les élèves de cette classe recevront les nouveaux montants</li>
            <li>• Les élèves d'autres classes ne seront pas affectés</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
