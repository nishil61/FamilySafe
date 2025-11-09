"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChangePasswordForm from "./ChangePasswordForm";
import ActiveDevices from "./ActiveDevices";
import DeleteAccount from "./DeleteAccount";
import { User, Shield } from "lucide-react";

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("account");

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="account">
          <User className="mr-2 h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="space-y-4">
        <ChangePasswordForm />
        <DeleteAccount />
      </TabsContent>
      <TabsContent value="security" className="space-y-4">
        <ActiveDevices />
      </TabsContent>
    </Tabs>
  );
}
