"use client";

import { Monitor, Smartphone, Tablet, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useActiveDevices } from "@/hooks/useActiveDevices";
import { useState } from "react";

export default function ActiveDevices() {
  const { toast } = useToast();
  const { devices, loading, error, revokeDevice } = useActiveDevices();
  const [revoking, setRevoking] = useState<string | null>(null);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return <Monitor className="h-6 w-6 text-muted-foreground" />;
      case 'mobile':
        return <Smartphone className="h-6 w-6 text-muted-foreground" />;
      case 'tablet':
        return <Tablet className="h-6 w-6 text-muted-foreground" />;
      default:
        return <Monitor className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      setRevoking(id);
      await revokeDevice(id);
      toast({
        title: "Device Access Revoked",
        description: "The device session has been revoked successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to revoke device access.",
      });
    } finally {
      setRevoking(null);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Devices</CardTitle>
          <CardDescription>
            Here is a list of devices that have signed into your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-sm">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Devices</CardTitle>
        <CardDescription>
          Here is a list of devices that have signed into your account. Revoke
          any session that you do not recognize.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading devices...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active devices found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  {getDeviceIcon(device.type)}
                  <div>
                    <p className="font-semibold">
                      {device.location}{" "}
                      {device.isCurrent && <span className="text-xs text-green-600 font-normal">(Current session)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last accessed: {device.lastAccessed}
                    </p>
                  </div>
                </div>
                {!device.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(device.id)}
                    disabled={revoking === device.id}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {revoking === device.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {revoking === device.id ? 'Revoking...' : 'Revoke'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
