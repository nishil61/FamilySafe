"use client";

import { Monitor, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Placeholder data - in a real app, this would come from Firestore with actual geolocation
const devices = [
  { id: '1', type: 'desktop', location: 'Demo Location 1', lastAccessed: '2 hours ago', current: true },
  { id: '2', type: 'mobile', location: 'Demo Location 2', lastAccessed: '1 day ago', current: false },
];

export default function ActiveDevices() {
  const { toast } = useToast();

  const handleRevoke = (id: string) => {
    // TODO: Implement actual device session revocation logic
    toast({
      title: "Device Access Revoked",
      description: `Access for device ${id} has been revoked.`,
    });
  };

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
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-4">
                {device.type === 'desktop' ? <Monitor className="h-6 w-6 text-muted-foreground" /> : <Smartphone className="h-6 w-6 text-muted-foreground" />}
                <div>
                  <p className="font-semibold">
                    {device.location}{" "}
                    {device.current && <span className="text-xs text-green-600 font-normal">(Current session)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last accessed: {device.lastAccessed}
                  </p>
                </div>
              </div>
              {!device.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(device.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
