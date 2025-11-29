import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentNavbar } from "@/components/layout/student-navbar";
import { format, differenceInHours, differenceInMinutes, isPast, parseISO, isFuture } from "date-fns";
import { uz } from "date-fns/locale";

interface Exam {
  id: number;
  name: string;
  subjectName: string;
  teacherName: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  questionsPerTicket: number;
  status: string;
  hasSession?: boolean;
  sessionStatus?: string;
  score?: number;
}

function ExamCountdown({ examDate, startTime }: { examDate: string; startTime: string }) {
  const examDateTime = parseISO(`${examDate}T${startTime}`);
  const now = new Date();

  if (isPast(examDateTime)) {
    return null;
  }

  const hoursLeft = differenceInHours(examDateTime, now);
  const minutesLeft = differenceInMinutes(examDateTime, now) % 60;

  let colorClass = "text-muted-foreground";
  if (hoursLeft < 24) {
    colorClass = "text-orange-600 dark:text-orange-400";
  }
  if (hoursLeft < 2) {
    colorClass = "text-red-600 dark:text-red-400 font-bold animate-pulse";
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <Clock className="w-4 h-4" />
      {hoursLeft > 0 ? `${hoursLeft} soat ` : ""}
      {minutesLeft} daqiqa qoldi
    </div>
  );
}

function getExamTypeBadge(name: string) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("yakuniy")) {
    return <Badge variant="destructive" className="text-xs">Yakuniy</Badge>;
  }
  if (nameLower.includes("oraliq")) {
    return <Badge variant="default" className="text-xs">Oraliq</Badge>;
  }
  return <Badge variant="secondary" className="text-xs">Joriy</Badge>;
}

function ExamCard({ exam, isCompleted }: { exam: Exam; isCompleted: boolean }) {
  const [showRules, setShowRules] = useState(false);
  const examDateTime = parseISO(`${exam.examDate}T${exam.startTime}`);
  const now = new Date();
  const isActive = exam.status === "active" || (isPast(examDateTime) && !isCompleted);
  const canStart = isActive && !exam.hasSession;
  const inProgress = exam.hasSession && exam.sessionStatus === "in_progress";

  return (
    <Card className="overflow-hidden" data-testid={`card-exam-${exam.id}`}>
      <CardContent className="p-0">
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <h3 className="text-xl font-semibold" data-testid={`text-subject-${exam.id}`}>
                {exam.subjectName}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {getExamTypeBadge(exam.name)}
                <span className="text-sm text-muted-foreground">{exam.name}</span>
              </div>
            </div>
            {isCompleted && exam.score !== undefined && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{exam.score}</div>
                <div className="text-xs text-muted-foreground">ball</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{exam.teacherName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(parseISO(exam.examDate), "d-MMMM yyyy", { locale: uz })}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Soat {exam.startTime} ({exam.durationMinutes} daqiqa)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{exam.questionsPerTicket} ta savol</span>
            </div>
          </div>

          {!isCompleted && (
            <ExamCountdown examDate={exam.examDate} startTime={exam.startTime} />
          )}

          <div>
            <button 
              onClick={() => setShowRules(!showRules)}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              type="button"
              data-testid={`button-details-${exam.id}`}
            >
              {showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Batafsil
            </button>
            
            {showRules && (
              <div className="mt-3 p-4 bg-muted rounded-lg space-y-2 text-sm">
                <h4 className="font-medium">Imtihon qoidalari:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Imtihon davomiyligi: {exam.durationMinutes} daqiqa</li>
                  <li>Savollar soni: {exam.questionsPerTicket} ta</li>
                  <li>Boshqa sahifalarga o'tish taqiqlanadi</li>
                  <li>Nusxalash (copy-paste) bloklangan</li>
                  <li>3 ta ogohlantirish = diskvalifikatsiya</li>
                  <li>Vaqt tugaganda javoblar avtomatik yuboriladi</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4 bg-muted/30">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Topshirilgan</span>
            </div>
          ) : inProgress ? (
            <Link href={`/talaba/imtihon/${exam.id}/session`}>
              <Button className="w-full" variant="default" data-testid={`button-continue-${exam.id}`}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Davom ettirish
              </Button>
            </Link>
          ) : canStart ? (
            <Link href={`/talaba/imtihon/${exam.id}/boshlash`}>
              <Button className="w-full" data-testid={`button-start-${exam.id}`}>
                Imtihonni boshlash
              </Button>
            </Link>
          ) : (
            <Button className="w-full" disabled data-testid={`button-start-${exam.id}`}>
              <Clock className="w-4 h-4 mr-2" />
              Imtihon boshlanmagan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentExamsPage() {
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/student/exams"],
  });

  const upcomingExams = exams?.filter(
    (e) => e.status !== "completed" && !e.hasSession
  ) || [];
  
  const completedExams = exams?.filter(
    (e) => e.status === "completed" || e.sessionStatus === "submitted"
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <StudentNavbar />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Imtihonlar</h1>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Yaqinlashayotgan ({upcomingExams.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              O'tkazilgan ({completedExams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : upcomingExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">Yaqinlashayotgan imtihonlar yo'q</h3>
                  <p className="text-sm text-muted-foreground">
                    Sizga tayinlangan imtihonlar bu yerda ko'rinadi
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} isCompleted={false} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : completedExams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">Topshirilgan imtihonlar yo'q</h3>
                  <p className="text-sm text-muted-foreground">
                    Topshirgan imtihonlaringiz natijalari shu yerda ko'rinadi
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} isCompleted={true} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
