import { DashboardLayout } from "@/components/dashboard-layout";
import { ErpProvider } from "@/components/providers/erp-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErpProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ErpProvider>
  );
}
