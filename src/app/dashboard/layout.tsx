import { DashboardLayout } from "@/components/dashboard-layout";
import { ErpProvider } from "@/components/providers/erp-provider";
import { AlertsProvider } from "@/components/providers/alerts-provider";

import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/actions/auth-actions';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialUser = undefined;
  if (user) {
    initialUser = await getUserProfile(user.id);
  }

  return (
    <ErpProvider initialUser={initialUser || undefined}>
      <AlertsProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </AlertsProvider>
    </ErpProvider>
  );
}
