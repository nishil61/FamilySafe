import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <SettingsTabs />
      </div>
    </DashboardLayout>
  );
}
