import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Users,
  BookOpen,
  GraduationCap,
  UserCircle,
  Activity,
  Settings,
  LogOut,
  FileText,
  ClipboardList,
  BarChart3,
  User,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const registratorNav: NavItem[] = [
  { label: "Bosh sahifa", href: "/registrator", icon: LayoutDashboard },
  { label: "Fakultetlar", href: "/registrator/fakultetlar", icon: Building2 },
  { label: "Yo'nalishlar", href: "/registrator/yonalishlar", icon: FolderTree },
  { label: "Guruhlar", href: "/registrator/guruhlar", icon: Users },
  { label: "Fanlar", href: "/registrator/fanlar", icon: BookOpen },
  { label: "O'qituvchilar", href: "/registrator/oqituvchilar", icon: GraduationCap },
  { label: "Talabalar", href: "/registrator/talabalar", icon: UserCircle },
  { label: "Monitoring", href: "/registrator/monitoring", icon: Activity },
  { label: "Sozlamalar", href: "/registrator/sozlamalar", icon: Settings },
];

const teacherNav: NavItem[] = [
  { label: "Bosh sahifa", href: "/oqituvchi", icon: LayoutDashboard },
  { label: "Mening fanlarim", href: "/oqituvchi/fanlar", icon: BookOpen },
  { label: "Leksiyalar", href: "/oqituvchi/leksiyalar", icon: FileText },
  { label: "Imtihonlar", href: "/oqituvchi/imtihonlar", icon: ClipboardList },
  { label: "Natijalar", href: "/oqituvchi/natijalar", icon: BarChart3 },
  { label: "Profil", href: "/oqituvchi/profil", icon: User },
];

const roleLabels: Record<string, string> = {
  registrator: "Registrator",
  oqituvchi: "O'qituvchi",
  talaba: "Talaba",
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navItems = user.role === "registrator" ? registratorNav : teacherNav;
  const roleLabel = roleLabels[user.role] || user.role;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col h-screen w-[260px] bg-zinc-950 text-white fixed left-0 top-0 border-r border-zinc-800 z-50 transition-all duration-300">
      <div className="p-6 border-b border-zinc-800/50">
        <Link href={user.role === "registrator" ? "/registrator" : "/oqituvchi"}>
          <div className="flex items-center gap-3 cursor-pointer group" data-testid="link-home">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src="/logo.png"
                alt="SmartExam"
                className="h-8 w-8 relative z-10"
                data-testid="img-sidebar-logo"
              />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent" data-testid="text-brand">SmartExam</span>
          </div>
        </Link>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
          <Avatar className="h-10 w-10 border border-zinc-700">
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-zinc-100" data-testid="text-user-name">
              {user.fullName}
            </p>
            <Badge variant="outline" className="text-[10px] mt-1 text-zinc-400 border-zinc-700 h-5 px-1.5 font-normal" data-testid="badge-role">
              {roleLabel}
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href ||
              (item.href !== "/registrator" &&
                item.href !== "/oqituvchi" &&
                location.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg mx-1 cursor-pointer transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                  data-testid={`nav-${item.href.split("/").pop()}`}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-zinc-500 group-hover:text-white")} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span>Chiqish</span>
        </Button>
      </div>
    </div>
  );
}
