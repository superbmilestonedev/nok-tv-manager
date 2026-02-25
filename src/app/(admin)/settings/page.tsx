"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Wifi, RefreshCw, MonitorSmartphone, LifeBuoy } from "lucide-react";

const APP_VERSION = "1.0.0";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);

  const copyVersion = () => {
    navigator.clipboard.writeText(APP_VERSION);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{brand.defaultEmoji}</span>
              <div>
                <p className="font-semibold">{brand.name} {brand.tagline}</p>
                <p className="text-sm text-muted-foreground">
                  Manage and display media on your TV screens.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="font-mono text-sm">{APP_VERSION}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyVersion}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Wifi className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Pages won&apos;t load or uploads fail</p>
                <p className="text-sm text-muted-foreground">
                  Check that your device is connected to WiFi or mobile data. Try refreshing the page.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <MonitorSmartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">TV not showing new files</p>
                <p className="text-sm text-muted-foreground">
                  After uploading, go to the TV app and press the refresh button on the folder. Make sure the TV is connected to the internet.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Something looks wrong or stuck</p>
                <p className="text-sm text-muted-foreground">
                  Try refreshing the page. If that doesn&apos;t help, sign out and sign back in.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <LifeBuoy className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Still need help?</p>
                <p className="text-sm text-muted-foreground">
                  If all else fails, contact Chef Reg or your tech team for support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
