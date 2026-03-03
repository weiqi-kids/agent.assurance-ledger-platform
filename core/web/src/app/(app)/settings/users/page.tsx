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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserPlus, Save } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  tenantId: string | null;
  image: string | null;
  createdAt: string;
}

const ROLES = [
  { value: "engagement-partner", label: "業務合夥人" },
  { value: "quality-manager", label: "品質經理" },
  { value: "tech-lead", label: "技術主管" },
  { value: "system-admin", label: "系統管理員" },
  { value: "auditor", label: "審計師" },
  { value: "viewer", label: "觀察者" },
];

const ROLE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  "engagement-partner": "default",
  "quality-manager": "default",
  "tech-lead": "default",
  "system-admin": "default",
  auditor: "secondary",
  viewer: "outline",
};

function getRoleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [pendingTenants, setPendingTenants] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/settings/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else if (res.status === 403) {
        setError("您沒有管理使用者的權限。");
      } else {
        setError("載入使用者失敗。");
      }
    } catch {
      setError("無法連線至伺服器。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleTenantChange = (userId: string, newTenant: string) => {
    setPendingTenants((prev) => ({ ...prev, [userId]: newTenant }));
  };

  const handleSave = async (userId: string) => {
    const newRole = pendingRoles[userId];
    const newTenant = pendingTenants[userId];
    if (!newRole && newTenant === undefined) return;

    setSavingUserId(userId);
    try {
      const payload: Record<string, string> = { userId };
      if (newRole) payload.role = newRole;
      if (newTenant !== undefined) payload.tenantId = newTenant;

      const res = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u;
            const updated = { ...u };
            if (newRole) updated.role = newRole;
            if (newTenant !== undefined) updated.tenantId = newTenant;
            return updated;
          })
        );
        setPendingRoles((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        setPendingTenants((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    } catch {
      // Silently fail
    } finally {
      setSavingUserId(null);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">使用者</h2>
          <p className="text-sm text-muted-foreground">
            管理使用者帳號及角色指派。
          </p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4" />
              邀請使用者
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>邀請使用者</DialogTitle>
              <DialogDescription>
                使用者邀請功能尚未開放。使用者可透過 Google 或 LINE OAuth 登入。首次登入後，管理員可在此指派角色。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
              >
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">尚無使用者</p>
          <p className="mt-1 text-sm">
            使用者首次登入後將顯示於此。
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>使用者</TableHead>
              <TableHead>電子郵件</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>租戶</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const currentRole = pendingRoles[user.id] ?? user.role;
              const currentTenant = pendingTenants[user.id] ?? user.tenantId ?? "";
              const hasChanged =
                pendingRoles[user.id] !== undefined ||
                pendingTenants[user.id] !== undefined;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.name ?? "未命名"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={currentRole}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>
                          <Badge
                            variant={
                              ROLE_COLORS[currentRole] ?? "outline"
                            }
                          >
                            {getRoleLabel(currentRole)}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      className="h-9 w-[140px] rounded-md border border-input bg-background px-3 text-sm"
                      placeholder="tenant-id"
                      value={currentTenant}
                      onChange={(e) =>
                        handleTenantChange(user.id, e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {hasChanged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(user.id)}
                        disabled={savingUserId === user.id}
                      >
                        {savingUserId === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        儲存
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
