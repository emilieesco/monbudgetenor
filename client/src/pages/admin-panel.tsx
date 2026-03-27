import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Plus, Trash2, Copy, Check, LogOut, RefreshCw } from "lucide-react";
import type { TeacherInvite } from "@shared/schema";

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [adminPwd, setAdminPwd] = useState("");

  const [invites, setInvites] = useState<TeacherInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function login() {
    setAuthError("");
    try {
      const res = await apiRequest("POST", "/api/admin/verify", { adminPassword: password });
      if (res.ok) {
        setAdminPwd(password);
        setAuthenticated(true);
        loadInvites(password);
      }
    } catch {
      setAuthError("Mot de passe incorrect.");
    }
  }

  async function loadInvites(pwd: string = adminPwd) {
    setLoading(true);
    try {
      const res = await apiRequest("GET", `/api/admin/teacher-invites?adminPassword=${encodeURIComponent(pwd)}`);
      const data = await res.json();
      setInvites(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function createInvite() {
    setCreating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/teacher-invites", {
        adminPassword: adminPwd,
        note: newNote.trim() || undefined,
      });
      const invite = await res.json();
      setInvites(prev => [invite, ...prev]);
      setNewNote("");
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function deleteInvite(id: string) {
    try {
      await apiRequest("DELETE", `/api/admin/teacher-invites/${id}?adminPassword=${encodeURIComponent(adminPwd)}`);
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch {
      // ignore
    }
  }

  function copyCode(invite: TeacherInvite) {
    navigator.clipboard.writeText(invite.code);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <CardTitle>Panneau Administrateur</CardTitle>
            <p className="text-sm text-muted-foreground">Accès réservé à l'administrateur</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-pwd">Mot de passe</Label>
              <Input
                id="admin-pwd"
                type="password"
                placeholder="Mot de passe admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                data-testid="input-admin-password"
              />
            </div>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <Button className="w-full" onClick={login} data-testid="button-admin-login">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unusedCount = invites.filter(i => !i.used).length;
  const usedCount = invites.filter(i => i.used).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Panneau Administrateur</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="default" onClick={() => loadInvites()} data-testid="button-refresh-invites">
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualiser
            </Button>
            <Button variant="ghost" size="default" onClick={() => setAuthenticated(false)} data-testid="button-admin-logout">
              <LogOut className="w-4 h-4 mr-1" />
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-3xl font-bold text-green-600">{unusedCount}</p>
              <p className="text-sm text-muted-foreground">Codes disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-3xl font-bold text-muted-foreground">{usedCount}</p>
              <p className="text-sm text-muted-foreground">Codes utilisés</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Générer un nouveau code d'invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="invite-note">Note (optionnel)</Label>
              <Input
                id="invite-note"
                placeholder="Ex: Pour Marie Dupont, École Saint-Luc"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                data-testid="input-invite-note"
              />
            </div>
            <Button onClick={createInvite} disabled={creating} data-testid="button-create-invite">
              <Plus className="w-4 h-4 mr-1" />
              {creating ? "Génération..." : "Générer un code"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Codes d'invitation ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun code généré pour l'instant.</p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card"
                    data-testid={`invite-row-${invite.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <code className="text-base font-mono font-bold tracking-wider">
                        {invite.code}
                      </code>
                      <Badge variant={invite.used ? "secondary" : "default"}>
                        {invite.used ? "Utilisé" : "Disponible"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {invite.note && (
                        <span className="text-xs text-muted-foreground hidden sm:block max-w-[120px] truncate">
                          {invite.note}
                        </span>
                      )}
                      {!invite.used && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyCode(invite)}
                          data-testid={`button-copy-${invite.id}`}
                        >
                          {copiedId === invite.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteInvite(invite.id)}
                        data-testid={`button-delete-${invite.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
