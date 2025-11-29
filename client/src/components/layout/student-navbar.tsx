import { Link, useLocation } from "wouter";
import { Home, ClipboardList, User, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Bosh sahifa", href: "/talaba", icon: Home },
  { label: "Imtihonlar", href: "/talaba/imtihonlar", icon: ClipboardList },
];

export function StudentNavbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
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
    <header className="h-16 bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        <Link href="/talaba">
          <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home">
            <img
              src="/logo.png"
              alt="SmartExam"
              className="h-8"
              data-testid="img-navbar-logo"
            />
            <span className="text-lg font-bold text-primary hidden sm:inline">
              SmartExam
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="gap-2"
                  data-testid={`nav-${item.href.split("/").pop()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {user.fullName.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.userId}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-profile">
                <User className="w-4 h-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={logout}
                data-testid="menu-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
