import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  Activity,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Building2,
  TrendingUp,
  LogIn,
  UserPlus,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { queryClient } from "@/lib/queryClient";

interface Stats {
  users: number;
  teachers: number;
  students: number;
  faculties: number;
  departments: number;
  groups: number;
  subjects: number;
  exams: number;
  activeExams: number;
  lectures: number;
  questions: number;
}

interface ActivityLog {
  id: number;
  userId: number | null;
  userRole: string | null;
  action: string;
  details: any;
  ipAddress: string | null;
  createdAt: string;
}

export default function MonitoringPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: logs, isLoading: logsLoading, refetch } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      login: LogIn,
      register: UserPlus,
      create: FileText,
      update: RefreshCw,
      delete: AlertTriangle,
      exam_start: ClipboardList,
      exam_submit: CheckCircle,
    };
    const Icon = icons[action.split("_")[0]] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getActionLabel = (action: string, details: any) => {
    const labels: Record<string, string> = {
      login: "Tizimga kirdi",
      logout: "Tizimdan chiqdi",
      create_faculty: "Fakultet yaratildi",
      create_department: "Yo'nalish yaratildi",
      create_group: "Guruh yaratildi",
      create_subject: "Fan yaratildi",
      create_teacher: "O'qituvchi qo'shildi",
      create_student: "Talaba qo'shildi",
      create_exam: "Imtihon yaratildi",
      upload_lecture: "Leksiya yuklandi",
      generate_questions: "Savollar generatsiya qilindi",
      exam_start: "Imtihon boshlandi",
      exam_submit: "Imtihon topshirildi",
      update_score: "Ball o'zgartirildi",
    };
    return labels[action] || action;
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      registrator: { variant: "default", label: "Registrator" },
      oqituvchi: { variant: "secondary", label: "O'qituvchi" },
      talaba: { variant: "outline", label: "Talaba" },
    };
    const { variant, label } = variants[role] || { variant: "outline" as const, label: role };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const statCards = [
    { label: "Jami foydalanuvchilar", value: stats?.users || 0, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { label: "O'qituvchilar", value: stats?.teachers || 0, icon: GraduationCap, color: "text-green-600 dark:text-green-400" },
    { label: "Talabalar", value: stats?.students || 0, icon: Users, color: "text-purple-600 dark:text-purple-400" },
    { label: "Fakultetlar", value: stats?.faculties || 0, icon: Building2, color: "text-orange-600 dark:text-orange-400" },
    { label: "Fanlar", value: stats?.subjects || 0, icon: BookOpen, color: "text-cyan-600 dark:text-cyan-400" },
    { label: "Guruhlar", value: stats?.groups || 0, icon: Users, color: "text-pink-600 dark:text-pink-400" },
    { label: "Imtihonlar", value: stats?.exams || 0, icon: ClipboardList, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Faol imtihonlar", value: stats?.activeExams || 0, icon: TrendingUp, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Monitoring" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">
              Tizim monitoringi
            </h2>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
                queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
              }}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Yangilash
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statsLoading
              ? Array(8)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </CardContent>
                    </Card>
                  ))
              : statCards.map((stat, i) => (
                  <Card key={i} data-testid={`stat-card-${i}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>So'nggi faoliyatlar</CardTitle>
                <CardDescription>Tizimda bajarilgan oxirgi 50 ta harakat</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : logs && logs.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`activity-log-${log.id}`}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {getActionLabel(log.action, log.details)}
                            </span>
                            {getRoleBadge(log.userRole)}
                          </div>
                          {log.details && (
                            <p className="text-sm text-muted-foreground truncate">
                              {typeof log.details === "object"
                                ? Object.entries(log.details)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")
                                : log.details}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(log.createdAt), "d-MMMM yyyy, HH:mm", { locale: uz })}
                            </span>
                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Faoliyat topilmadi
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hali hech qanday faoliyat qayd etilmagan
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
