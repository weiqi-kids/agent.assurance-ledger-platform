import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, Cog } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/settings/users">
        <Card className="transition-colors hover:bg-accent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              User Management
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage users, roles, and permissions.
            </p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/settings/system">
        <Card className="transition-colors hover:bg-accent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              System Configuration
            </CardTitle>
            <Cog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              GitHub App status, audit period, GPG keys.
            </p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/settings/ai-providers">
        <Card className="transition-colors hover:bg-accent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Providers</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure AI models and API connections.
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
