import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, Users, ClipboardCheck, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/layout/sidebar";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Stats {
  faculties: number;
  teachers: number;
  students: number;
  activeExams: number;
}

interface ActivityLog {
  id: number;
  action: string;
  userRole: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface UpcomingExam {
  id: number;
  name: string;
  subjectName: string;
  teacherName: string;
  examDate: string;
  startTime: string;
  status: string;
  groups: string[];
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  title: string;
  value: number | string;
  subtitle: string;
  icon: typeof Building2;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold mt-1 tracking-tight">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between mb-4">
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegistratorDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const { data: upcomingExams, isLoading: examsLoading } = useQuery<UpcomingExam[]>({
    queryKey: ["/api/exams/upcoming"],
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      scheduled: { variant: "outline", label: "Rejalashtirilgan" },
      active: { variant: "default", label: "Faol" },
      completed: { variant: "secondary", label: "Yakunlangan" },
      draft: { variant: "outline", label: "Qoralama" },
    };
    const { variant, label } = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={variant} className="capitalize">{label}</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <AppSidebar />
      <div className="flex-1 ml-64 p-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Boshqaruv Paneli</h1>
            <p className="text-muted-foreground mt-1">
              Tizimning umumiy holati va statistikasi bilan tanishing.
            </p>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
            Bugun: {new Date().toLocaleDateString("uz-UZ", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        <main className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Fakultetlar"
                  value={stats?.faculties || 0}
                  subtitle="Mavjud fakultetlar"
                  icon={Building2}
                />
                <StatCard
                  title="O'qituvchilar"
                  value={stats?.teachers || 0}
                  subtitle="Ro'yxatdan o'tgan"
                  icon={GraduationCap}
                />
                <StatCard
                  title="Talabalar"
                  value={stats?.students || 0}
                  subtitle="Faol talabalar"
                  icon={Users}
                />
                <StatCard
                  title="Faol Imtihonlar"
                  value={stats?.activeExams || 0}
                  subtitle="Ayni paytda bo'layotgan"
                  icon={ClipboardCheck}
                  className="border-primary/20 bg-primary/5"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Activity Log */}
            <Card className="border-border/60 shadow-sm h-full">
              <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  So'nggi faoliyat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activitiesLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {activities.slice(0, 6).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="mt-1 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), {
                                addSuffix: true,
                                locale: uz,
                              })}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                              {activity.userRole}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Hozircha faoliyat yo'q</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Exams */}
            <Card className="border-border/60 shadow-sm h-full">
              <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
                  Yaqinlashayotgan imtihonlar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {examsLoading ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : upcomingExams && upcomingExams.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {upcomingExams.slice(0, 5).map((exam) => (
                      <div
                        key={exam.id}
                        className="p-4 hover:bg-muted/30 transition-colors group flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">{exam.subjectName}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{exam.teacherName}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {exam.examDate} | {exam.startTime}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(exam.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Rejalashtirilgan imtihonlar yo'q</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

