import { AppSidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Globe, Moon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      <AppSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-8">

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Sozlamalar</h1>
            <p className="text-muted-foreground mt-1">Tizim va ilova sozlamalarini boshqarish.</p>
          </div>

          <div className="grid gap-6">

            {/* General Settings */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <CardTitle>Umumiy Sozlamalar</CardTitle>
                </div>
                <CardDescription>
                  Til va mintaqa sozlamalari.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Tizim tili</Label>
                    <p className="text-sm text-muted-foreground">
                      Interfeys tilini tanlang.
                    </p>
                  </div>
                  <Button variant="outline" className="w-[120px]">O'zbekcha</Button>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border/50 pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Tungi rejim</Label>
                    <p className="text-sm text-muted-foreground">
                      Interfeys ranglarini o'zgartirish.
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <CardTitle>Bildirishnomalar</CardTitle>
                </div>
                <CardDescription>
                  Qaysi holatlarda xabar olishni xohlaysiz.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email bildirishnomalar</Label>
                    <p className="text-sm text-muted-foreground">
                      Muhim xabarlarni email orqali olish.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border/50 pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Imtihon eslatmalari</Label>
                    <p className="text-sm text-muted-foreground">
                      Imtihon boshlanishi haqida ogohlantirish.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle>Xavfsizlik</CardTitle>
                </div>
                <CardDescription>
                  Accaunt xavfsizligini ta'minlash.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base text-red-600">Xavfli hudud</Label>
                    <p className="text-sm text-muted-foreground">
                      Tizimdan barcha qurilmalardan chiqish.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">Barchadan chiqish</Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
