import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Shield, Database, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState("SmartExam");
  const [minPasswordLength, setMinPasswordLength] = useState("8");
  const [requireSpecialChars, setRequireSpecialChars] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);

  const handleExportData = async () => {
    try {
      toast({ title: "Ma'lumotlar yuklanmoqda...", description: "Iltimos kuting" });
      const response = await fetch("/api/admin/export-data", {
        credentials: "include"
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `smartexam_backup_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: "Muvaffaqiyatli!", description: "Ma'lumotlar eksport qilindi" });
      } else {
        toast({ variant: "destructive", title: "Xatolik!", description: "Eksport qilishda xatolik" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Eksport qilishda xatolik" });
    }
  };

  const handleSaveSettings = () => {
    toast({ title: "Muvaffaqiyatli!", description: "Sozlamalar saqlandi" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Sozlamalar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Sozlamalar</h2>
          </div>

          <Tabs defaultValue="system" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="system" data-testid="tab-system">
                <Settings className="w-4 h-4 mr-2" />
                Tizim
              </TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">
                <Shield className="w-4 h-4 mr-2" />
                Xavfsizlik
              </TabsTrigger>
              <TabsTrigger value="data" data-testid="tab-data">
                <Database className="w-4 h-4 mr-2" />
                Ma'lumotlar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tizim sozlamalari</CardTitle>
                  <CardDescription>Platforma umumiy sozlamalari</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Platforma nomi</Label>
                    <Input
                      id="platform-name"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      placeholder="SmartExam"
                      data-testid="input-platform-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logotip</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted">
                        <img 
                          src="/logo.png" 
                          alt="Logo" 
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <Button variant="outline" data-testid="button-upload-logo">
                        <Upload className="w-4 h-4 mr-2" />
                        Logotip yuklash
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <Button onClick={handleSaveSettings} data-testid="button-save-system">
                    <Save className="w-4 h-4 mr-2" />
                    Saqlash
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Xavfsizlik sozlamalari</CardTitle>
                  <CardDescription>Parol va autentifikatsiya sozlamalari</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="min-password">Minimal parol uzunligi</Label>
                    <Input
                      id="min-password"
                      type="number"
                      min="6"
                      max="32"
                      value={minPasswordLength}
                      onChange={(e) => setMinPasswordLength(e.target.value)}
                      className="w-32"
                      data-testid="input-min-password"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="special-chars">Maxsus belgilar talab qilinsin</Label>
                      <p className="text-sm text-muted-foreground">
                        Parolda maxsus belgilar (!@#$%^&*) bo'lishi shart
                      </p>
                    </div>
                    <Switch
                      id="special-chars"
                      checked={requireSpecialChars}
                      onCheckedChange={setRequireSpecialChars}
                      data-testid="switch-special-chars"
                    />
                  </div>
                  <Separator />
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Parol formati</h4>
                    <p className="text-sm text-muted-foreground">
                      Yangi foydalanuvchilar uchun parol formati: <br />
                      <code className="bg-background px-2 py-1 rounded">password + ID (kichik harflarda)</code>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Masalan: T001 uchun parol <code className="bg-background px-2 py-1 rounded">passwordt001</code>
                    </p>
                  </div>
                  <Separator />
                  <Button onClick={handleSaveSettings} data-testid="button-save-security">
                    <Save className="w-4 h-4 mr-2" />
                    Saqlash
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ma'lumotlarni boshqarish</CardTitle>
                  <CardDescription>Eksport va zaxira nusxalash</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-backup">Avtomatik zaxira</Label>
                      <p className="text-sm text-muted-foreground">
                        Har kuni avtomatik zaxira nusxasini yaratish
                      </p>
                    </div>
                    <Switch
                      id="auto-backup"
                      checked={autoBackup}
                      onCheckedChange={setAutoBackup}
                      data-testid="switch-auto-backup"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Ma'lumotlarni eksport qilish</h4>
                    <p className="text-sm text-muted-foreground">
                      Barcha ma'lumotlarni JSON formatida yuklash
                    </p>
                    <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
                      <Database className="w-4 h-4 mr-2" />
                      Ma'lumotlarni eksport qilish
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">HEMIS integratsiyasi</h4>
                    <p className="text-sm text-muted-foreground">
                      Imtihon natijalarini HEMIS tizimiga eksport qilish uchun 
                      O'qituvchi panelidan foydalaning.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
