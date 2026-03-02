import { GovernanceNav } from "@/components/governance/governance-nav";

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Governance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control inventory, role matrix, RACI assignments, and framework
          mappings.
        </p>
      </div>
      <GovernanceNav />
      {children}
    </div>
  );
}
