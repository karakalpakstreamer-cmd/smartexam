import { Building2, GraduationCap, Mail, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
    });

    const getInitials = (name: string) => {
        return name
            ? name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "U";
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await apiRequest("PATCH", "/api/auth/profile", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setIsEditOpen(false);
            toast({ title: "Muvaffaqiyatli", description: "Profil yangilandi" });
        },
        onError: () => {
            toast({ variant: "destructive", title: "Xatolik", description: "Profilni yangilashda xatolik" });
        },
    });

    const handleEditClick = () => {
        setFormData({
            fullName: user?.fullName || "",
            email: user?.email || "",
            phone: user?.phone || "",
        });
        setIsEditOpen(true);
    };

    const handleSave = () => {
        updateProfileMutation.mutate(formData);
    };

    if (!user) return null;

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
                        <Button variant="outline" onClick={handleEditClick}>Profilni tahrirlash</Button>
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
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">{user.isActive ? "Faol" : "Nofaol"}</Badge>
                                </div>
                                <div className="mt-6 w-full space-y-3 text-sm">
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground font-medium">Foydalanuvchi ID</span>
                                        <span className="text-foreground font-mono">{user.userId}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground font-medium">Qo'shilgan sana</span>
                                        <span className="text-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</span>
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
                                            -
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

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Profilni tahrirlash</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">F.I.O</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Bekor qilish</Button>
                        <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
