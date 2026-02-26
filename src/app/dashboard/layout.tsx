import { DashboardLayout } from "@/components/dashboard-layout";
import { ErpProvider } from "@/components/providers/erp-provider";
import { AlertsProvider } from "@/components/providers/alerts-provider";
import { AutoLogout } from "@/components/auto-logout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErpProvider>
      <AlertsProvider>
        <AutoLogout />
        <DashboardLayout>{children}</DashboardLayout>
      </AlertsProvider>
    </ErpProvider>
  );
}
