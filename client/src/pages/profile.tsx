import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, User, Lock, Mail, Phone, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
    fullName: z.string().min(3, "Ism kamida 3 ta belgidan iborat bo'lishi kerak"),
    email: z.string().email("Noto'g'ri email format").optional().or(z.literal("")),
    phone: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Joriy parol kiritilishi shart"),
    newPassword: z.string().min(6, "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    confirmPassword: z.string().min(6, "Parolni tasdiqlang"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
});

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user?.fullName || "",
            email: user?.email || "",
            phone: user?.phone || "",
        },
    });

    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
        setIsProfileLoading(true);
        try {
            await apiRequest("PATCH", "/api/auth/profile", values);
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            toast({
                title: "Muvaffaqiyatli!",
                description: "Profil ma'lumotlari yangilandi",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Xatolik!",
                description: error.message || "Profilni yangilashda xatolik yuz berdi",
            });
        } finally {
            setIsProfileLoading(false);
        }
    };

    const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
        setIsPasswordLoading(true);
        try {
            await apiRequest("PATCH", "/api/auth/password", {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            passwordForm.reset();
            toast({
                title: "Muvaffaqiyatli!",
                description: "Parol o'zgartirildi",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Xatolik!",
                description: error.message || "Parolni o'zgartirishda xatolik yuz berdi",
            });
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    if (!user) return null;

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
                    Mening profilim
                </h1>
                <p className="text-muted-foreground mt-2">
                    Shaxsiy ma'lumotlar va xavfsizlik sozlamalarini boshqaring
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-zinc-200/50 shadow-sm overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-primary/10" />
                        <CardContent className="pt-0 relative px-6 pb-6">
                            <div className="flex flex-col items-center -mt-12 text-center">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                                        {getInitials(user.fullName)}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="mt-4 text-xl font-bold text-zinc-900">{user.fullName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                                        {user.role}
                                    </span>
                                </div>
                                <div className="mt-4 w-full space-y-2 text-sm text-muted-foreground text-left">
                                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-50 transition-colors">
                                        <User className="h-4 w-4 text-primary max-w-[16px]" />
                                        <span className="truncate">{user.userId}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-50 transition-colors">
                                        <Mail className="h-4 w-4 text-primary max-w-[16px]" />
                                        <span className="truncate">{user.email || "Email kiritilmagan"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-50 transition-colors">
                                        <Phone className="h-4 w-4 text-primary max-w-[16px]" />
                                        <span className="truncate">{user.phone || "Telefon kiritilmagan"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card className="border-zinc-200/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Asosiy ma'lumotlar
                            </CardTitle>
                            <CardDescription>
                                Ism, email va telefon raqamingizni o'zgartiring
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>F.I.SH</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" placeholder="example@domain.com" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Telefon</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="+998901234567" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isProfileLoading} className="w-full md:w-auto">
                                            {isProfileLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saqlanmoqda...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Saqlash
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                Xavfsizlik
                            </CardTitle>
                            <CardDescription>
                                Parolni yangilash
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Joriy parol</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={passwordForm.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Yangi parol</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="password" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={passwordForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Parolni tasdiqlang</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="password" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isPasswordLoading} variant="outline" className="w-full md:w-auto">
                                            {isPasswordLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    O'zgartirilmoqda...
                                                </>
                                            ) : (
                                                <>
                                                    Parolni o'zgartirish
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
