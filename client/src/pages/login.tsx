import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, BookOpen, GraduationCap, User, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Column - Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary flex-col justify-between p-16 text-primary-foreground overflow-hidden">

        {/* Abstract Background Pattern - More dynamic */}
        <div className="absolute inset-0 opacity-[0.08]">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 0 L100 100 Z" fill="currentColor" />
            <circle cx="50" cy="50" r="40" fill="currentColor" fillOpacity="0.5" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <img
              src="/logo.png"
              alt="SmartExam"
              className="h-14 w-14 brightness-0 invert drop-shadow-md"
              data-testid="img-logo"
            />
            <span className="text-3xl font-bold tracking-tight">SmartExam</span>
          </div>

          <h1 className="text-6xl font-sans font-bold leading-tight mb-8 tracking-tight">
            Ta'lim sifatini <br />
            <span className="text-primary-foreground/90">yangi bosqichga</span> <br />
            olib chiqing.
          </h1>

          <p className="text-xl text-primary-foreground/80 max-w-lg font-normal leading-relaxed">
            Adolatli, shaffof va zamonaviy imtihon tizimi.
            Barcha jarayonlar to'liq avtomatlashtirilgan.
          </p>
        </div>

        <div className="relative z-10 flex gap-6 text-sm font-medium text-primary-foreground/70">
          <span className="cursor-pointer hover:text-white transition-colors">© 2024 SmartExam</span>
          <span className="cursor-pointer hover:text-white transition-colors">Maxfiylik siyosati</span>
          <span className="cursor-pointer hover:text-white transition-colors">Yordam</span>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-[480px] space-y-10 animate-fade-in-up">

          <div className="text-center lg:text-left space-y-3">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground" data-testid="text-title">
              Xush kelibsiz
            </h2>
            <p className="text-muted-foreground text-lg">
              Davom etish uchun o'z vazifangizni (rolingizni) tanlang va tizimga kiring.
            </p>
          </div>

          <div className="space-y-8">
            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ease-in-out cursor-pointer overflow-hidden ${isSelected
                      ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    data-testid={`button-role-${role.id}`}
                  >
                    <Icon
                      className={`w-7 h-7 mb-3 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                    />
                    <span
                      className={`text-sm font-semibold transition-colors ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                    >
                      {role.label}
                    </span>

                    {isSelected && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="ID raqamingiz"
                            className="pl-12 h-14 bg-muted/40 border-border focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary transition-all duration-200 text-base rounded-xl"
                            data-testid="input-user-id"
                            autoComplete="off"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="ml-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Parol"
                            className="pl-12 pr-12 h-14 bg-muted/40 border-border focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary transition-all duration-200 text-base rounded-xl"
                            data-testid="input-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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
                      <FormMessage className="ml-1" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                  disabled={isSubmitting}
                  data-testid="button-login"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Tizimga kirilmoqda...
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Kirish <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

