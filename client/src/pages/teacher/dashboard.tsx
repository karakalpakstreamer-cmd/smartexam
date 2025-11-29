import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, FileText, ClipboardList, Plus, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface TeacherStats {
  subjectsCount: number;
  lecturesCount: number;
  todayExamsCount: number;
}

interface TodayExam {
  id: number;
  name: string;
  subjectName: string;
  startTime: string;
  groups: string[];
  status: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
}: {
  title: string;
  value: number | string;
  icon: typeof BookOpen;
  iconBgColor: string;
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
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/ /g, "-")}`}>
            {value}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: todayExams, isLoading: examsLoading } = useQuery<TodayExam[]>({
    queryKey: ["/api/teacher/today-exams"],
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      scheduled: { variant: "outline", label: "Rejalashtirilgan" },
      active: { variant: "default", label: "Faol" },
      completed: { variant: "secondary", label: "Yakunlangan" },
    };
    const { variant, label } = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const today = new Date();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Bosh sahifa" />
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1" data-testid="text-welcome">
              Salom, {user?.fullName?.split(" ")[0]}!
            </h2>
            <p className="text-muted-foreground">
              {format(today, "d-MMMM yyyy, EEEE", { locale: uz })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {statsLoading ? (
              <>
                <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
              </>
            ) : (
              <>
                <StatCard
                  title="Mening fanlarim"
                  value={stats?.subjectsCount || 0}
                  icon={BookOpen}
                  iconBgColor="bg-blue-500"
                />
                <StatCard
                  title="Yuklangan leksiyalar"
                  value={stats?.lecturesCount || 0}
                  icon={FileText}
                  iconBgColor="bg-green-500"
                />
                <StatCard
                  title="Bugungi imtihonlar"
                  value={stats?.todayExamsCount || 0}
                  icon={ClipboardList}
                  iconBgColor="bg-orange-500"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg">Bugungi imtihonlar</CardTitle>
              </CardHeader>
              <CardContent>
                {examsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : todayExams && todayExams.length > 0 ? (
                  <div className="space-y-3">
                    {todayExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`exam-${exam.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-medium">{exam.subjectName}</p>
                            <p className="text-sm text-muted-foreground">{exam.name}</p>
                          </div>
                          {getStatusBadge(exam.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {exam.startTime}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {exam.groups.map((g, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3">
                          {exam.status === "scheduled" && (
                            <Button size="sm" data-testid={`button-start-${exam.id}`}>
                              Boshlash
                            </Button>
                          )}
                          {exam.status === "active" && (
                            <Link href={`/oqituvchi/imtihonlar/${exam.id}/monitoring`}>
                              <Button size="sm" data-testid={`button-monitor-${exam.id}`}>
                                Monitoring
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Bugun imtihon yo'q</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tezkor harakatlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/oqituvchi/leksiyalar">
                  <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-upload-lecture">
                    <FileText className="w-4 h-4" />
                    Leksiya yuklash
                  </Button>
                </Link>
                <Link href="/oqituvchi/imtihonlar/yaratish">
                  <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-create-exam">
                    <Plus className="w-4 h-4" />
                    Imtihon yaratish
                  </Button>
                </Link>
                <Link href="/oqituvchi/natijalar">
                  <Button className="w-full justify-start gap-2" variant="outline" data-testid="button-view-results">
                    <ClipboardList className="w-4 h-4" />
                    Natijalarni ko'rish
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
