"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  KeyRound,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [pinUser, setPinUser] = useState<User | null>(null);
  const [newPin, setNewPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Create form
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Change PIN form
  const [customPin, setCustomPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      toast.error("Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = useCallback(async () => {
    setFormError("");
    if (!newUsername.trim()) {
      setFormError("Enter a username.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Couldn't create user.");
        return;
      }

      setNewPin(data.generatedPin);
      setNewUsername("");
      setNewEmail("");
      setCreateOpen(false);
      fetchUsers();
    } catch {
      setFormError("Can't connect. Check your internet.");
    } finally {
      setFormLoading(false);
    }
  }, [newUsername, newEmail, fetchUsers]);

  const handleDelete = useCallback(async () => {
    if (!deleteUser) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Couldn't delete user.");
        return;
      }
      toast.success("User deleted.");
      setDeleteUser(null);
      fetchUsers();
    } catch {
      toast.error("Couldn't delete user.");
    } finally {
      setFormLoading(false);
    }
  }, [deleteUser, fetchUsers]);

  const handleChangePin = useCallback(async () => {
    if (!pinUser) return;
    setPinError("");

    if (!customPin) {
      setPinError("Enter a PIN.");
      return;
    }
    if (customPin.length !== 6) {
      setPinError("PIN must be exactly 6 digits.");
      return;
    }
    if (!/^\d+$/.test(customPin)) {
      setPinError("PIN must be numbers only.");
      return;
    }

    setPinLoading(true);
    try {
      const res = await fetch(`/api/users/${pinUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: customPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || "Couldn't change PIN.");
        return;
      }
      toast.success(`PIN updated for ${pinUser.username}.`);
      setPinUser(null);
      setCustomPin("");
      setShowPin(false);
    } catch {
      setPinError("Can't connect. Check your internet.");
    } finally {
      setPinLoading(false);
    }
  }, [pinUser, customPin]);

  const copyPin = useCallback(() => {
    if (newPin) {
      navigator.clipboard.writeText(newPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [newPin]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || "\u2014"}
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge variant="default" className="text-xs">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        User
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPinUser(user);
                          setCustomPin("");
                          setPinError("");
                          setShowPin(false);
                        }}
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                        Change PIN
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteUser(user)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setNewUsername("");
            setNewEmail("");
            setFormError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value);
                  setFormError("");
                }}
                placeholder="e.g. maria"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email (optional)</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. maria@example.com"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Display Dialog (after creating user) */}
      <Dialog
        open={!!newPin}
        onOpenChange={(open) => {
          if (!open) setNewPin(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>PIN Generated</DialogTitle>
            <DialogDescription>
              Share this PIN with the user. It won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-3 py-6">
            <span className="text-4xl font-mono font-bold tracking-[0.3em]">
              {newPin}
            </span>
            <Button variant="outline" size="icon" onClick={copyPin}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setNewPin(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{deleteUser?.username}</strong>? They
              won't be able to log in anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog
        open={!!pinUser}
        onOpenChange={(open) => {
          if (!open) {
            setPinUser(null);
            setCustomPin("");
            setPinError("");
            setShowPin(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change PIN</DialogTitle>
            <DialogDescription>
              Set a new login PIN for <strong>{pinUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-pin">New PIN</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-pin"
                  type={showPin ? "text" : "password"}
                  value={customPin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCustomPin(v);
                    setPinError("");
                  }}
                  placeholder="Enter 6-digit PIN"
                  inputMode="numeric"
                  autoFocus
                  className="font-mono tracking-widest"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be exactly 6 digits. Their current PIN will stop working.
              </p>
            </div>
            {pinError && (
              <p className="text-sm text-destructive">{pinError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePin}
              disabled={pinLoading || !customPin}
            >
              {pinLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
