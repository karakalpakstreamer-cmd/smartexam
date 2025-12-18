import { Building2, GraduationCap, Mail, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const user = {
        fullName: "Sultan Qudaybergenov Bakhitbaevich",
        id: "R001",
        role: "Registrator",
        email: "sultan.q@smartexam.uz",
        phone: "+998 90 123 45 67",
        department: "O'quv bo'limi",
        joinDate: "Sentabr 2023",
        status: "Faol"
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex min-h-screen bg-background font-sans">
            <AppSidebar />
            <div className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mening Profilim</h1>
                            <p className="text-muted-foreground mt-1">Shaxsiy ma'lumotlar va akkaunt holati.</p>
                        </div>
                        <Button variant="outline">Profilni tahrirlash</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Info Card */}
                        <Card className="md:col-span-1 border-border/60 shadow-sm h-fit">
                            <CardContent className="pt-6 flex flex-col items-center text-center">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-lg mb-4">
                                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                                        {getInitials(user.fullName)}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-bold text-foreground">{user.fullName}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="px-3 py-1">{user.role}</Badge>
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">{user.status}</Badge>
                                </div>
                                <div className="mt-6 w-full space-y-3 text-sm">
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground font-medium">ID Raqam</span>
                                        <span className="text-foreground font-mono">{user.id}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground font-medium">Qo'shilgan sana</span>
                                        <span className="text-foreground">{user.joinDate}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Details Card */}
                        <Card className="md:col-span-2 border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Batafsil ma'lumot</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5" /> Email manzil
                                        </label>
                                        <p className="text-sm font-medium p-3 bg-muted/30 rounded-lg border border-border/50">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5" /> Telefon raqam
                                        </label>
                                        <p className="text-sm font-medium p-3 bg-muted/30 rounded-lg border border-border/50">
                                            {user.phone}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5" /> Bo'lim
                                        </label>
                                        <p className="text-sm font-medium p-3 bg-muted/30 rounded-lg border border-border/50">
                                            {user.department}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <User className="w-3.5 h-3.5" /> Lavozim
                                        </label>
                                        <p className="text-sm font-medium p-3 bg-muted/30 rounded-lg border border-border/50">
                                            Bosh Registrator
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/50">
                                    <h3 className="text-sm font-semibold mb-4 text-foreground">Xavfsizlik</h3>
                                    <div className="flex items-center justify-between p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-yellow-900">Parolni o'zgartirish</p>
                                            <p className="text-xs text-yellow-700">So'nggi marta 3 oy oldin o'zgartirilgan.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="border-yellow-200 text-yellow-800 hover:bg-yellow-50 hover:text-yellow-900">
                                            O'zgartirish
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
