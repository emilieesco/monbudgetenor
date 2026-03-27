import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Users, Plus, Edit2, Settings, Home as HomeIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Student } from "@shared/schema";

export default function Home() {
  const [_location, navigate] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentBudget, setStudentBudget] = useState("");
  const [newBudget, setNewBudget] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["/api/students"],
  });

  const createStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/students", {
        name: studentName,
        budget: parseFloat(studentBudget),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setShowCreateDialog(false);
      setStudentName("");
      setStudentBudget("");
      navigate(`/student/${data.id}`);
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async () => {
      if (!editingStudent) return;
      const res = await apiRequest("PATCH", `/api/students/${editingStudent.id}/budget`, {
        budget: parseFloat(newBudget),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setShowEditDialog(false);
      setEditingStudent(null);
      setNewBudget("");
    },
  });

  const students = studentsQuery.data as Student[] || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Home Button */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <HomeIcon className="w-4 h-4" />
            Accueil
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-5xl font-bold text-primary mb-4">Mon Budget en Or</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Apprenez à gérer votre argent avec sagesse. Gagnez 50$, payez vos dépenses fixes, achetez intelligemment!
            </p>
            <Button
              size="lg"
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer un Élève
            </Button>
          </div>
          <Button
            onClick={() => navigate("/admin")}
            variant="outline"
            className="absolute top-4 right-4 flex items-center gap-2"
            data-testid="button-admin-panel"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Enseignant</span>
          </Button>
        </div>

        {/* Students Grid */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Élèves Inscrits</h2>
          </div>

          {students.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Aucun élève créé pour le moment</p>
              <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                Créer le premier élève
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {students.map(student => (
                <Card
                  key={student.id}
                  className="p-6 hover-elevate transition-all cursor-pointer"
                  onClick={() => navigate(`/student/${student.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">Budget: ${student.budget}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStudent(student);
                        setNewBudget(student.budget.toString());
                        setShowEditDialog(true);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dépensé:</span>
                      <span className="font-semibold">${student.spent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Restant:</span>
                      <span className={`font-semibold ${student.budget - student.spent >= 0 ? "text-green-600" : "text-destructive"}`}>
                        ${student.budget - student.spent}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/student/${student.id}`);
                    }}
                  >
                    Gérer le Budget
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Student Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un Nouvel Élève</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel élève et définissez son budget de départ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'Élève</Label>
              <Input
                id="name"
                placeholder="Ex: Jean Dupont"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                data-testid="input-student-name"
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget Initial ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Ex: 50"
                value={studentBudget}
                onChange={(e) => setStudentBudget(e.target.value)}
                min="1"
                data-testid="input-student-budget"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setStudentName("");
                setStudentBudget("");
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => createStudentMutation.mutate()}
              disabled={!studentName || !studentBudget || createStudentMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-student"
            >
              {createStudentMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Budget</DialogTitle>
            <DialogDescription>
              Changez le budget de {editingStudent?.name}
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="new-budget">Nouveau Budget ($)</Label>
            <Input
              id="new-budget"
              type="number"
              placeholder="Ex: 75"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              min="1"
              data-testid="input-new-budget"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingStudent(null);
                setNewBudget("");
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => updateBudgetMutation.mutate()}
              disabled={!newBudget || updateBudgetMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-update-budget"
            >
              {updateBudgetMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
