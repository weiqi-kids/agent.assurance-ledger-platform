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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface AIProvider {
  id: string;
  name: string;
  providerType: string;
  model: string;
  apiEndpoint: string | null;
  enabled: number;
  createdAt: string;
  updatedAt: string;
}

interface ProviderFormData {
  name: string;
  providerType: string;
  model: string;
  apiEndpoint: string;
  enabled: boolean;
}

const MODEL_PLACEHOLDERS: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  google: "gemini-2.0-flash",
};

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

const defaultFormData: ProviderFormData = {
  name: "",
  providerType: "anthropic",
  model: "",
  apiEndpoint: "",
  enabled: true,
};

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/ai-providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleAdd = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/ai-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          providerType: formData.providerType,
          model: formData.model,
          apiEndpoint: formData.apiEndpoint || undefined,
          enabled: formData.enabled,
        }),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setFormData(defaultFormData);
        fetchProviders();
      }
    } catch {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/settings/ai-providers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          providerType: formData.providerType,
          model: formData.model,
          apiEndpoint: formData.apiEndpoint || null,
          enabled: formData.enabled,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        setFormData(defaultFormData);
        fetchProviders();
      }
    } catch {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/settings/ai-providers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProviders();
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch(
        `/api/settings/ai-providers/${id}/test`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResults((prev) => ({
          ...prev,
          [id]: {
            success: true,
            message: `OK (${data.latencyMs}ms)`,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [id]: {
            success: false,
            message: data.error || "Connection failed",
          },
        }));
      }
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, message: "Network error" },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const openEditDialog = (provider: AIProvider) => {
    setFormData({
      name: provider.name,
      providerType: provider.providerType,
      model: provider.model,
      apiEndpoint: provider.apiEndpoint || "",
      enabled: provider.enabled === 1,
    });
    setEditingId(provider.id);
  };

  const toggleEnabled = async (provider: AIProvider) => {
    try {
      await fetch(`/api/settings/ai-providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: provider.enabled !== 1 }),
      });
      fetchProviders();
    } catch {
      // Silently fail
    }
  };

  const renderForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="providerType">Provider Type</Label>
        <Select
          value={formData.providerType}
          onValueChange={(v) =>
            setFormData((prev) => ({ ...prev, providerType: v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="google">Google</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g. Claude Sonnet"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model ID</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, model: e.target.value }))
          }
          placeholder={
            MODEL_PLACEHOLDERS[formData.providerType] ?? "model-id"
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiEndpoint">API Endpoint (optional)</Label>
        <Input
          id="apiEndpoint"
          value={formData.apiEndpoint}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              apiEndpoint: e.target.value,
            }))
          }
          placeholder="Custom API endpoint URL"
        />
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="enabled">Enabled</Label>
        <button
          type="button"
          role="switch"
          aria-checked={formData.enabled}
          onClick={() =>
            setFormData((prev) => ({ ...prev, enabled: !prev.enabled }))
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
            formData.enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
              formData.enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Providers</h2>
          <p className="text-sm text-muted-foreground">
            Configure AI model providers. API keys are set via environment
            variables.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => setFormData(defaultFormData)}
            >
              <Plus className="h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add AI Provider</DialogTitle>
              <DialogDescription>
                Configure a new AI model provider. API keys must be set as
                environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY,
                GOOGLE_AI_API_KEY).
              </DialogDescription>
            </DialogHeader>
            {renderForm()}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  !formData.name || !formData.model || isSaving
                }
              >
                {isSaving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Add Provider
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setFormData(defaultFormData);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit AI Provider</DialogTitle>
            <DialogDescription>
              Update the provider configuration.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setFormData(defaultFormData);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name || !formData.model || isSaving}
            >
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No providers configured</p>
          <p className="mt-1 text-sm">
            Add an AI provider to start using the chat feature.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Test</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">
                  {provider.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {PROVIDER_TYPE_LABELS[provider.providerType] ??
                      provider.providerType}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {provider.model}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => toggleEnabled(provider)}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={
                        provider.enabled === 1
                          ? "default"
                          : "secondary"
                      }
                    >
                      {provider.enabled === 1 ? "Enabled" : "Disabled"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleTest(provider.id)}
                      disabled={testingId === provider.id}
                    >
                      {testingId === provider.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      Test
                    </Button>
                    {testResults[provider.id] && (
                      <span className="flex items-center gap-1 text-xs">
                        {testResults[provider.id].success ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                        <span
                          className={
                            testResults[provider.id].success
                              ? "text-green-600"
                              : "text-destructive"
                          }
                        >
                          {testResults[provider.id].message}
                        </span>
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEditDialog(provider)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(provider.id)}
                      disabled={deletingId === provider.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingId === provider.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
