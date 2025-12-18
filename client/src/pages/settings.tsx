import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Laptop, Globe, Bell } from "lucide-react";

export default function SettingsPage() {
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Muvaffaqiyatli!",
            description: "Sozlamalar saqlandi (hozircha vizual)",
        });
    };

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                    Sozlamalar
                </h1>
                <p className="text-muted-foreground mt-2">
                    Tizim ko'rinishi va ishlashini moslashtiring
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Sun className="h-5 w-5 text-primary" />
                            <CardTitle>Mavzu</CardTitle>
                        </div>
                        <CardDescription>
                            Tizimning tashqi ko'rinishini tanlang
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup defaultValue="light" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                                <Label
                                    htmlFor="light"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                >
                                    <Sun className="mb-3 h-6 w-6" />
                                    Yorug'
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="dark" id="dark" className="peer sr-only" disabled />
                                <Label
                                    htmlFor="dark"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 opacity-50 cursor-not-allowed peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all"
                                >
                                    <Moon className="mb-3 h-6 w-6" />
                                    Qorong'u (Tez orada)
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="system" id="system" className="peer sr-only" disabled />
                                <Label
                                    htmlFor="system"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 opacity-50 cursor-not-allowed peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all"
                                >
                                    <Laptop className="mb-3 h-6 w-6" />
                                    Tizim
                                </Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <CardTitle>Til</CardTitle>
                        </div>
                        <CardDescription>
                            Interfeys tilini o'zgartirish
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroup defaultValue="uz" className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="uz" id="lang-uz" />
                                    <Label htmlFor="lang-uz">O'zbekcha</Label>
                                </div>
                                <div className="flex items-center space-x-2 opacity-50">
                                    <RadioGroupItem value="ru" id="lang-ru" disabled />
                                    <Label htmlFor="lang-ru">Русский (Tez orada)</Label>
                                </div>
                                <div className="flex items-center space-x-2 opacity-50">
                                    <RadioGroupItem value="en" id="lang-en" disabled />
                                    <Label htmlFor="lang-en">English (Coming soon)</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <CardTitle>Bildirishnomalar</CardTitle>
                        </div>
                        <CardDescription>
                            Qaysi holatlarda xabar olishni xohlaysiz?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="notifications-email" className="flex flex-col space-y-1">
                                <span>Email xabarlari</span>
                                <span className="font-normal text-xs text-muted-foreground">Yangi imtihonlar va natijalar haqida</span>
                            </Label>
                            <Switch id="notifications-email" />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="notifications-browser" className="flex flex-col space-y-1">
                                <span>Brauzer bildirishnomalari</span>
                                <span className="font-normal text-xs text-muted-foreground">Tizim ichidagi voqealar</span>
                            </Label>
                            <Switch id="notifications-browser" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} className="w-full md:w-auto">
                        Sozlamalarni saqlash
                    </Button>
                </div>
            </div>
        </div>
    );
}
