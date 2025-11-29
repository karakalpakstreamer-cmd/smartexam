import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, BookOpen, GraduationCap, User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const loginSchema = z.object({
  userId: z.string().min(1, "ID raqamingizni kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const roles = [
  { id: "registrator", label: "Registrator", icon: ShieldCheck },
  { id: "oqituvchi", label: "O'qituvchi", icon: BookOpen },
  { id: "talaba", label: "Talaba", icon: GraduationCap },
] as const;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<string>("registrator");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const success = await login(data.userId, data.password, selectedRole);
      if (success) {
        toast({
          title: "Muvaffaqiyatli!",
          description: "Tizimga kirdingiz",
        });
        if (selectedRole === "registrator") {
          setLocation("/registrator");
        } else if (selectedRole === "oqituvchi") {
          setLocation("/oqituvchi");
        } else {
          setLocation("/talaba");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description: "ID yoki parol noto'g'ri",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Tizimga kirishda xatolik yuz berdi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-500 p-4">
      <Card className="w-full max-w-[420px] shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <img
              src="/logo.png"
              alt="SmartExam"
              className="h-12 mb-4"
              data-testid="img-logo"
            />
            <h1 className="text-2xl font-bold text-primary" data-testid="text-brand">
              SmartExam
            </h1>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-tagline">
              Adolatli imtihon tizimi
            </p>
          </div>

          <h2 className="text-xl font-semibold text-center mb-6" data-testid="text-title">
            Tizimga kirish
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid={`button-role-${role.id}`}
                >
                  <Icon
                    className={`w-6 h-6 mb-2 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          placeholder="ID raqamingiz"
                          className="pl-10 h-11"
                          data-testid="input-user-id"
                          {...field}
                        />
                      </div>
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
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Parol"
                          className="pl-10 pr-10 h-11"
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
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isSubmitting}
                data-testid="button-login"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kirish...
                  </>
                ) : (
                  "Kirish"
                )}
              </Button>
            </form>
          </Form>

          <p className="text-xs text-muted-foreground text-center mt-8" data-testid="text-support">
            Texnik yordam: support@smartexam.uz
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
