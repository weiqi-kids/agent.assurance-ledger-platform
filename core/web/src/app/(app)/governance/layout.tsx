import { GovernanceNav } from "@/components/governance/governance-nav";

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">治理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          控制點清單、角色矩陣、RACI 分工及框架映射。
        </p>
      </div>
      <GovernanceNav />
      {children}
    </div>
  );
}
