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
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex flex-col h-screen w-[260px] bg-slate-900 text-white fixed left-0 top-0">
      <div className="p-4 border-b border-slate-700">
        <Link href={user.role === "registrator" ? "/registrator" : "/oqituvchi"}>
          <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home">
            <img
              src="/logo.png"
              alt="SmartExam"
              className="h-8 w-8"
              data-testid="img-sidebar-logo"
            />
            <span className="text-lg font-bold" data-testid="text-brand">SmartExam</span>
          </div>
        </Link>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user.fullName}
            </p>
            <Badge variant="secondary" className="text-xs mt-1" data-testid="badge-role">
              {roleLabel}
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
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
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg mx-2 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  data-testid={`nav-${item.href.split("/").pop()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800"
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
