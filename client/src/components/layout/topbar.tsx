import { Bell, ChevronDown, Sun, Moon } from "lucide-react";
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

interface TopbarProps {
  title: string;
  breadcrumb?: string[];
}

export function Topbar({ title, breadcrumb }: TopbarProps) {
  const { user, logout } = useAuth();
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

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        {breadcrumb?.map((item, index) => (
          <span key={index} className="text-muted-foreground text-sm">
            {item}
            {index < breadcrumb.length - 1 && (
              <span className="mx-2 text-muted-foreground">/</span>
            )}
          </span>
        ))}
        <h1 className="text-xl font-semibold" data-testid="text-page-title">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
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

        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2" data-testid="button-user-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? getInitials(user.fullName) : "??"}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.userId}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-profile">Profil</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-settings">Sozlamalar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={logout}
              data-testid="menu-logout"
            >
              Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
