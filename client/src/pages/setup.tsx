import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const setupSchema = z
  .object({
    fullName: z.string().min(3, "Kamida 3 ta belgi bo'lishi kerak"),
    email: z.string().email("Noto'g'ri email format").or(z.literal("")),
    phone: z.string().optional(),
    password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  });

type SetupFormData = z.infer<typeof setupSchema>;

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const labels = ["Juda zaif", "Zaif", "O'rta", "Kuchli", "Juda kuchli"];
  const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-600"];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= strength ? colors[strength - 1] : "bg-muted"
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-muted-foreground">
          Parol kuchi: {labels[Math.max(0, strength - 1)]}
        </p>
      )}
    </div>
  );
}

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");

  const onSubmit = async (data: SetupFormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/setup", {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        password: data.password,
      });
      toast({
        title: "Muvaffaqiyatli!",
        description: "Tizim sozlandi. Endi tizimga kirishingiz mumkin.",
      });
      setLocation("/login");
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Tizimni sozlashda xatolik yuz berdi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-500 p-4">
      <Card className="w-full max-w-[480px] shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="SmartExam"
              className="h-12"
              data-testid="img-logo"
            />
          </div>
          <CardTitle className="text-2xl" data-testid="text-title">
            SmartExam - Boshlang'ich sozlash
          </CardTitle>
          <CardDescription data-testid="text-subtitle">
            Birinchi Registrator hisobini yarating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-sm font-medium">Registrator ID</p>
                <p className="text-lg font-mono font-bold text-primary" data-testid="text-registrator-id">
                  R001
                </p>
                <p className="text-xs text-muted-foreground">
                  Avtomatik tayinlangan
                </p>
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>F.I.O. *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="To'liq ismingiz"
                        data-testid="input-full-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+998 90 123 45 67"
                        data-testid="input-phone"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parol *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Kamida 6 ta belgi"
                          className="pr-10"
                          data-testid="input-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <PasswordStrength password={password} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parolni tasdiqlang *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Parolni qayta kiriting"
                          className="pr-10"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="flex items-center gap-1 text-xs">
                        {field.value === password ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-green-600">Parollar mos</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-destructive" />
                            <span className="text-destructive">Parollar mos kelmadi</span>
                          </>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 mt-6"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sozlanmoqda...
                  </>
                ) : (
                  "Tizimni ishga tushirish"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
