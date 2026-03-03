import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bot, Cog } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="mt-1 text-muted-foreground">
          設定使用者、系統選項及 AI 供應商整合。
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/settings/users">
        <Card className="transition-colors hover:bg-accent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              使用者管理
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              管理使用者、角色與權限。
            </p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/settings/system">
        <Card className="transition-colors hover:bg-accent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              系統設定
            </CardTitle>
            <Cog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              GitHub App 狀態、審計期間、GPG 金鑰。
            </p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/settings/ai-providers">
        <Card className="transition-colors hover:bg-accent/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI 供應商</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              設定 AI 模型與 API 連線。
            </p>
          </CardContent>
        </Card>
      </Link>
      </div>
    </div>
  );
}
