import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, Users, ClipboardCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

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
  iconBgColor,
  pulse,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: typeof Building2;
  iconBgColor: string;
  pulse?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgColor}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          {pulse && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1" data-testid={`stat-${title.toLowerCase().replace(/ /g, "-")}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="mt-4 space-y-2">
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
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Bosh sahifa" />
        <main className="p-6">
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
                  subtitle="ta fakultet"
                  icon={Building2}
                  iconBgColor="bg-blue-500"
                />
                <StatCard
                  title="O'qituvchilar"
                  value={stats?.teachers || 0}
                  subtitle="ta o'qituvchi"
                  icon={GraduationCap}
                  iconBgColor="bg-green-500"
                />
                <StatCard
                  title="Talabalar"
                  value={stats?.students || 0}
                  subtitle="ta talaba"
                  icon={Users}
                  iconBgColor="bg-purple-500"
                />
                <StatCard
                  title="Faol imtihonlar"
                  value={stats?.activeExams || 0}
                  subtitle="ta imtihon"
                  icon={ClipboardCheck}
                  iconBgColor="bg-orange-500"
                  pulse={(stats?.activeExams || 0) > 0}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">So'nggi faoliyat</CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                        data-testid={`activity-${activity.id}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: uz,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.userRole}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Hozircha faoliyat yo'q</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yaqinlashayotgan imtihonlar</CardTitle>
              </CardHeader>
              <CardContent>
                {examsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-3 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : upcomingExams && upcomingExams.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingExams.slice(0, 5).map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`exam-${exam.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{exam.subjectName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {exam.teacherName}
                            </p>
                          </div>
                          {getStatusBadge(exam.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{exam.examDate}</span>
                          <span>{exam.startTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Yaqinlashayotgan imtihon yo'q</p>
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
