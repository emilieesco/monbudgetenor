import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Home, Plus, Send, Gift, Target, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Class, CustomChallenge, TeacherMessage, SurpriseEvent } from "@shared/schema";

export default function TeacherDashboard() {
  const { classId } = useParams();
  const [_location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"students" | "challenges" | "messages" | "events">("students");

  // Form states
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeTarget, setChallengeTarget] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState<"congratulations" | "warning" | "info">("info");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [eventType, setEventType] = useState<"bonus_salary" | "promo" | "emergency_expense">("bonus_salary");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventAmount, setEventAmount] = useState("");

  // Queries
  const classQuery = useQuery({ queryKey: ["/api/classes", classId] });
  const studentsQuery = useQuery({
    queryKey: ["/api/classes", classId, "students"],
  });
  const customChallengesQuery = useQuery({
    queryKey: ["/api/custom-challenges", classId],
  });
  const messagesQuery = useQuery({
    queryKey: ["/api/messages/class", classId],
  });
  const eventsQuery = useQuery({
    queryKey: ["/api/surprise-events", classId],
  });

  // Mutations
  const createChallengeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/custom-challenges", {
        classId,
        title: challengeTitle,
        description: challengeDesc,
        type: "custom",
        targetValue: parseFloat(challengeTarget),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-challenges", classId] });
      setChallengeTitle("");
      setChallengeDesc("");
      setChallengeTarget("");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/messages", {
        classId,
        studentId: selectedStudentId || undefined,
        content: messageContent,
        type: messageType,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/class", classId] });
      setMessageContent("");
      setSelectedStudentId("");
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/surprise-events", {
        classId,
        type: eventType,
        title: eventTitle,
        description: eventDesc,
        amount: parseFloat(eventAmount),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surprise-events", classId] });
      setEventType("bonus_salary");
      setEventTitle("");
      setEventDesc("");
      setEventAmount("");
      toast({
        title: "Événement créé!",
        description: "L'événement surprise a été créé avec succès.",
      });
    },
    onError: (error) => {
      console.error("Event creation error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement.",
        variant: "destructive",
      });
    },
  });

  const applyEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest("PATCH", `/api/surprise-events/${eventId}/apply`, {
        studentId: selectedStudentId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surprise-events", classId] });
    },
  });

  const classData = classQuery.data as Class | undefined;
  const students = studentsQuery.data as Student[] || [];
  const challenges = customChallengesQuery.data as CustomChallenge[] || [];
  const messages = messagesQuery.data as TeacherMessage[] || [];
  const events = eventsQuery.data as SurpriseEvent[] || [];

  if (!classData) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Tableau de Bord - {classData.teacherName}</h1>
            <p className="text-lg text-muted-foreground">Code: <span className="font-mono font-bold">{classData.code}</span></p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Retour
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["students", "challenges", "messages", "events"].map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab as any)}
              className="flex items-center gap-2"
            >
              {tab === "students" && <Users className="w-4 h-4" />}
              {tab === "challenges" && <Target className="w-4 h-4" />}
              {tab === "messages" && <Send className="w-4 h-4" />}
              {tab === "events" && <Gift className="w-4 h-4" />}
              {tab === "students" && "Étudiants"}
              {tab === "challenges" && "Défis"}
              {tab === "messages" && "Messages"}
              {tab === "events" && "Événements"}
            </Button>
          ))}
        </div>

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Étudiants de la Classe ({students.length})</h2>
            {students.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucun étudiant n'a rejoint la classe pour le moment.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {students.map(student => (
                  <Card key={student.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{student.name}</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Budget Actuel</p>
                            <p className="font-bold">${student.budget}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Dépensé</p>
                            <p className="font-bold text-destructive">${student.spent}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Épargne</p>
                            <p className="font-bold text-purple-600">${student.savings}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">{Math.round(100 - (student.spent / student.budget * 100))}% restant</Badge>
                      </div>
                    </div>
                    {student.budgetHistory && student.budgetHistory.length > 1 && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Historique des Budgets ({student.budgetHistory.length})</p>
                        <div className="space-y-1">
                          {student.budgetHistory.map((h, i) => {
                            const date = typeof h.date === 'string' ? new Date(h.date) : h.date;
                            return (
                              <div key={i} className="text-xs flex justify-between p-1.5 bg-muted rounded">
                                <span>Essai {student.budgetHistory!.length - i}</span>
                                <span className="font-semibold">${h.budget}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Créer un Défi Personnalisé</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="challenge-title">Titre du défi</Label>
                  <Input
                    id="challenge-title"
                    placeholder="Ex: Économise 100$ cette semaine"
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    data-testid="input-challenge-title"
                  />
                </div>
                <div>
                  <Label htmlFor="challenge-desc">Description</Label>
                  <Input
                    id="challenge-desc"
                    placeholder="Explique le défi en détail"
                    value={challengeDesc}
                    onChange={(e) => setChallengeDesc(e.target.value)}
                    data-testid="input-challenge-desc"
                  />
                </div>
                <div>
                  <Label htmlFor="challenge-target">Valeur cible</Label>
                  <Input
                    id="challenge-target"
                    type="number"
                    placeholder="100"
                    value={challengeTarget}
                    onChange={(e) => setChallengeTarget(e.target.value)}
                    data-testid="input-challenge-target"
                  />
                </div>
                <Button
                  onClick={() => createChallengeMutation.mutate()}
                  disabled={!challengeTitle || !challengeDesc || !challengeTarget || createChallengeMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Créer le Défi
                </Button>
              </div>
            </Card>

            {challenges.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Défis Actifs</h3>
                <div className="space-y-3">
                  {challenges.map(ch => (
                    <div key={ch.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{ch.title}</p>
                        <p className="text-sm text-muted-foreground">{ch.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Objectif: {ch.targetValue}</p>
                      </div>
                      <Badge>{ch.completedBy.length} complété{ch.completedBy.length !== 1 ? "s" : ""}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Envoyer un Message</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message-type">Type de message</Label>
                  <select
                    id="message-type"
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    data-testid="select-message-type"
                  >
                    <option value="congratulations">Félicitations</option>
                    <option value="warning">Avertissement</option>
                    <option value="info">Information</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="message-student">Étudiant (optionnel - laisse vide pour toute la classe)</Label>
                  <select
                    id="message-student"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    data-testid="select-message-student"
                  >
                    <option value="">Toute la classe</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="message-content">Message</Label>
                  <textarea
                    id="message-content"
                    placeholder="Écris ton message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-24"
                    data-testid="input-message-content"
                  />
                </div>
                <Button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!messageContent || sendMessageMutation.isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </Button>
              </div>
            </Card>

            {messages.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Messages Envoyés</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map(msg => (
                    <div key={msg.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={msg.type === "congratulations" ? "default" : msg.type === "warning" ? "destructive" : "secondary"}>
                          {msg.type === "congratulations" ? "Félicitations" : msg.type === "warning" ? "Avertissement" : "Info"}
                        </Badge>
                        {msg.studentId && <p className="text-xs text-muted-foreground">{students.find(s => s.id === msg.studentId)?.name}</p>}
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Créer un Événement Surprise</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-type">Type d'événement</Label>
                  <select
                    id="event-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    data-testid="select-event-type"
                  >
                    <option value="bonus_salary">Salaire Bonus</option>
                    <option value="emergency_expense">Dépense d'Urgence</option>
                    <option value="promo">Promo Magasin</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="event-title">Titre</Label>
                  <Input
                    id="event-title"
                    placeholder="Ex: Bonus travail d'été"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    data-testid="input-event-title"
                  />
                </div>
                <div>
                  <Label htmlFor="event-desc">Description</Label>
                  <Input
                    id="event-desc"
                    placeholder="Détails de l'événement"
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    data-testid="input-event-desc"
                  />
                </div>
                <div>
                  <Label htmlFor="event-amount">Montant ($)</Label>
                  <Input
                    id="event-amount"
                    type="number"
                    placeholder="50"
                    value={eventAmount}
                    onChange={(e) => setEventAmount(e.target.value)}
                    data-testid="input-event-amount"
                  />
                </div>
                <Button
                  onClick={() => createEventMutation.mutate()}
                  disabled={!eventTitle || !eventDesc || !eventAmount || createEventMutation.isPending}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Gift className="w-4 h-4" />
                  Créer l'Événement
                </Button>
              </div>
            </Card>

            {events.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Événements Actifs</h3>
                <div className="space-y-3">
                  {events.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-sm font-bold mt-1">
                          {event.type === "bonus_salary" && "💰 "}
                          {event.type === "emergency_expense" && "⚠️ "}
                          {event.type === "promo" && "🏪 "}
                          ${event.amount}
                        </p>
                      </div>
                      {event.type === "bonus_salary" || event.type === "emergency_expense" ? (
                        <select
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="px-2 py-1 border border-border rounded text-sm bg-background"
                          data-testid="select-event-student"
                        >
                          <option value="">Appliquer à...</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : null}
                      {selectedStudentId && (event.type === "bonus_salary" || event.type === "emergency_expense") && (
                        <Button
                          size="sm"
                          onClick={() => applyEventMutation.mutate(event.id)}
                          disabled={applyEventMutation.isPending}
                          className="ml-2"
                        >
                          Appliquer
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
