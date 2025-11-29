import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, Clock, Users, CheckCircle2, AlertTriangle, 
  Timer, RefreshCw, Play, Send, XCircle, Eye, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface StudentStatus {
  id: number;
  fullName: string;
  groupName: string;
  status: "waiting" | "in_progress" | "submitted" | "disqualified";
  answeredCount: number;
  totalQuestions: number;
  timeSpent: string;
  tabSwitches: number;
  sessionId?: number;
}

interface ActivityLog {
  id: number;
  studentName: string;
  action: string;
  type: "start" | "answer" | "warning" | "disqualified" | "submit";
  timestamp: string;
}

interface MonitoringData {
  exam: {
    id: number;
    name: string;
    subjectName: string;
    durationMinutes: number;
    startTime: string;
    status: string;
  };
  stats: {
    total: number;
    started: number;
    submitted: number;
    problematic: number;
  };
  students: StudentStatus[];
  activities: ActivityLog[];
  remainingSeconds: number;
}

export default function ExamMonitoringPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/oqituvchi/imtihonlar/:id/monitoring");
  const examId = params?.id;
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data, isLoading, refetch } = useQuery<MonitoringData>({
    queryKey: ["/api/teacher/exam", examId, "monitoring"],
    enabled: !!examId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  const endExamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/teacher/exam/${examId}/end`);
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyatli!",
        description: "Imtihon tugatildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/exam", examId, "monitoring"] });
      setLocation("/oqituvchi/imtihonlar");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Imtihonni tugatishda xatolik",
      });
    },
  });

  const addTimeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/teacher/exam/${examId}/add-time`, { minutes: 10 });
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyatli!",
        description: "10 daqiqa qo'shildi",
      });
      refetch();
    },
  });

  const formatRemainingTime = (seconds: number) => {
    if (seconds <= 0) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: StudentStatus["status"]) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary" data-testid="badge-status-waiting">Kutmoqda</Badge>;
      case "in_progress":
        return (
          <Badge className="bg-blue-500 text-white animate-pulse" data-testid="badge-status-inprogress">
            Yozmoqda
          </Badge>
        );
      case "submitted":
        return <Badge className="bg-green-500 text-white" data-testid="badge-status-submitted">Topshirdi</Badge>;
      case "disqualified":
        return <Badge variant="destructive" data-testid="badge-status-disqualified">Chetlashtirildi</Badge>;
    }
  };

  const getActivityIcon = (type: ActivityLog["type"]) => {
    switch (type) {
      case "start":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "answer":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "disqualified":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "submit":
        return <Send className="w-4 h-4 text-green-600" />;
    }
  };

  const getActivityClass = (type: ActivityLog["type"]) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
      case "disqualified":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
      case "submit":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
      default:
        return "";
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">Imtihon topilmadi</p>
          <Button onClick={() => setLocation("/oqituvchi/imtihonlar")} className="mt-4">
            Orqaga qaytish
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/oqituvchi/imtihonlar")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold" data-testid="text-exam-name">{data.exam.name}</h1>
              <p className="text-muted-foreground" data-testid="text-subject-name">{data.exam.subjectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
              <span>Yangilandi: {format(lastUpdated, "HH:mm:ss")}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => addTimeMutation.mutate()}
              disabled={addTimeMutation.isPending}
              data-testid="button-add-time"
            >
              <Plus className="w-4 h-4 mr-2" />
              Vaqt qo'shish
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-end-exam">
                  Imtihonni tugatish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Imtihonni tugatish</AlertDialogTitle>
                  <AlertDialogDescription>
                    Barcha talabalar uchun imtihon tugatiladi. Bu amalni qaytarib bo'lmaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => endExamMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-end"
                  >
                    Ha, tugatish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Timer className="w-8 h-8 mx-auto mb-1 text-primary" />
                  <div 
                    className={`text-3xl md:text-4xl font-mono font-bold ${data.remainingSeconds < 300 ? 'text-red-500' : ''}`}
                    data-testid="text-timer"
                  >
                    {formatRemainingTime(data.remainingSeconds)}
                  </div>
                  <p className="text-sm text-muted-foreground">Qolgan vaqt</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="text-total">{data.stats.total}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" /> Jami talabalar
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500" data-testid="text-started">{data.stats.started}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Play className="w-4 h-4" /> Boshlagan
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500" data-testid="text-submitted">{data.stats.submitted}</div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Topshirgan
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${data.stats.problematic > 0 ? 'text-red-500' : ''}`} data-testid="text-problematic">
                    {data.stats.problematic}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Muammoli
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg">Talabalar holati</CardTitle>
                <Badge variant="outline">{data.students.length} ta</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.students.map((student) => (
                    <Card 
                      key={student.id} 
                      className={`hover-elevate cursor-pointer ${student.tabSwitches > 0 ? 'border-yellow-400' : ''}`}
                      data-testid={`card-student-${student.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={
                              student.status === "disqualified" ? "bg-red-100 text-red-700" :
                              student.status === "submitted" ? "bg-green-100 text-green-700" :
                              student.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }>
                              {getInitials(student.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate" data-testid={`text-student-name-${student.id}`}>
                                {student.fullName}
                              </p>
                              {student.tabSwitches > 0 && (
                                <Badge variant="destructive" className="text-xs" data-testid={`badge-warning-${student.id}`}>
                                  ⚠️ {student.tabSwitches}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{student.groupName}</p>
                            <div className="flex items-center justify-between mt-2">
                              {getStatusBadge(student.status)}
                              {student.status !== "waiting" && (
                                <span className="text-xs text-muted-foreground">
                                  {student.answeredCount}/{student.totalQuestions} savol
                                </span>
                              )}
                            </div>
                            {student.status === "in_progress" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {student.timeSpent}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {data.students.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Talabalar topilmadi
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg">Faoliyat jurnali</CardTitle>
                <Badge variant="outline">{data.activities.length}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-4 space-y-2">
                    {data.activities.map((activity) => (
                      <div 
                        key={activity.id}
                        className={`flex items-start gap-3 p-2 rounded-lg border ${getActivityClass(activity.type)}`}
                        data-testid={`activity-${activity.id}`}
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.studentName}</span>{" "}
                            <span className="text-muted-foreground">{activity.action}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), "HH:mm:ss", { locale: uz })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {data.activities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Hozircha faoliyat yo'q
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
