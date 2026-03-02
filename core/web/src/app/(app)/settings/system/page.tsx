"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Pencil,
  Save,
  Plus,
  Github,
  KeyRound,
  Calendar,
} from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string | null;
}

interface GitHubStatus {
  connected: boolean;
  repository?: string;
  error?: string;
}

const WELL_KNOWN_SETTINGS: Record<
  string,
  { label: string; description: string; icon: React.ReactNode }
> = {
  audit_period: {
    label: "Audit Period",
    description: "Current audit period (e.g. 2025-Q1)",
    icon: <Calendar className="h-4 w-4" />,
  },
  gpg_key_id: {
    label: "GPG Key ID",
    description: "Primary GPG key used for commit signing",
    icon: <KeyRound className="h-4 w-4" />,
  },
  organization_name: {
    label: "Organization Name",
    description: "Name of the organization for reports",
    icon: null,
  },
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [isCheckingGithub, setIsCheckingGithub] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/settings/system");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      } else if (res.status === 403) {
        setError("You do not have permission to view system settings.");
      } else {
        setError("Failed to load system settings.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGithubStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/github-status");
      if (res.ok) {
        const data = await res.json();
        setGithubStatus(data);
      } else {
        setGithubStatus({ connected: false, error: "Failed to check status" });
      }
    } catch {
      setGithubStatus({ connected: false, error: "Network error" });
    } finally {
      setIsCheckingGithub(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchGithubStatus();
  }, [fetchSettings, fetchGithubStatus]);

  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSave = async () => {
    if (!editingKey) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editingKey, value: editValue }),
      });

      if (res.ok) {
        setEditingKey(null);
        setEditValue("");
        fetchSettings();
      }
    } catch {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newKey || !newValue) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });

      if (res.ok) {
        setIsAddOpen(false);
        setNewKey("");
        setNewValue("");
        fetchSettings();
      }
    } catch {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">System Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Manage system settings, GitHub integration, and GPG configuration.
        </p>
      </div>

      {/* GitHub App Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Github className="h-5 w-5" />
              GitHub App Connection
            </CardTitle>
            <CardDescription>
              GitHub App provides auditable, scoped access to the repository.
            </CardDescription>
          </div>
          {isCheckingGithub ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : githubStatus?.connected ? (
            <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="gap-1"
            >
              <XCircle className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isCheckingGithub ? (
            <p className="text-sm text-muted-foreground">
              Checking connection...
            </p>
          ) : githubStatus?.connected ? (
            <p className="text-sm text-muted-foreground">
              Repository:{" "}
              <span className="font-mono font-medium text-foreground">
                {githubStatus.repository}
              </span>
            </p>
          ) : (
            <p className="text-sm text-destructive">
              {githubStatus?.error ??
                "Unable to connect. Check environment variables."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* GPG Key Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5" />
            GPG Signing
          </CardTitle>
          <CardDescription>
            All commits to the main branch must be GPG signed. The GPG
            Signature Verification workflow enforces this as a merge gate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>
              GPG signing is configured per developer via{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                git config user.signingkey
              </code>
              . The CI workflow{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                gpg-verify.yml
              </code>{" "}
              verifies all PR commits are signed before allowing merge.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Settings Key-Value Pairs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Settings</CardTitle>
            <CardDescription>
              Key-value configuration for the platform.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Setting
          </Button>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No settings configured yet. Add a setting to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {settings.map((setting) => {
                const meta = WELL_KNOWN_SETTINGS[setting.key];
                const isEditing = editingKey === setting.key;

                return (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {meta?.icon}
                        <span className="text-sm font-medium">
                          {meta?.label ?? setting.key}
                        </span>
                        {meta && (
                          <span className="text-xs text-muted-foreground">
                            ({setting.key})
                          </span>
                        )}
                      </div>
                      {meta?.description && (
                        <p className="text-xs text-muted-foreground">
                          {meta.description}
                        </p>
                      )}
                      {isEditing ? (
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 max-w-xs text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingKey(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <p className="font-mono text-sm">{setting.value}</p>
                      )}
                    </div>
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleEdit(setting.key, setting.value)
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Setting Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add System Setting</DialogTitle>
            <DialogDescription>
              Add a new key-value configuration setting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="setting-key">Key</Label>
              <Input
                id="setting-key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. audit_period"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setting-value">Value</Label>
              <Input
                id="setting-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. 2025-Q1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newKey || !newValue || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Setting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
