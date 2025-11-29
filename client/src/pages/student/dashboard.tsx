import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ClipboardList, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentNavbar } from "@/components/layout/student-navbar";
import { useAuth } from "@/lib/auth";
import { format, differenceInHours, differenceInMinutes, isPast, parseISO } from "date-fns";
import { uz } from "date-fns/locale";

interface StudentInfo {
  groupName: string;
  courseYear: number;
  facultyName: string;
  departmentName: string;
}

interface UpcomingExam {
  id: number;
  name: string;
  subjectName: string;
  teacherName: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  status: string;
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
    colorClass = "text-orange-600";
  }
  if (hoursLeft < 2) {
    colorClass = "text-red-600 font-bold animate-pulse";
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <Clock className="w-4 h-4" />
      {hoursLeft > 0 ? `${hoursLeft} soat ` : ""}
      {minutesLeft} daqiqa qoldi
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: studentInfo } = useQuery<StudentInfo>({
    queryKey: ["/api/student/info"],
  });

  const { data: upcomingExams, isLoading } = useQuery<UpcomingExam[]>({
    queryKey: ["/api/student/upcoming-exams"],
  });

  const today = new Date();
  const alertExams = upcomingExams?.filter((exam) => {
    const examDateTime = parseISO(`${exam.examDate}T${exam.startTime}`);
    return differenceInHours(examDateTime, today) <= 24 && !isPast(examDateTime);
  });

  return (
    <div className="min-h-screen bg-background">
      <StudentNavbar />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-1" data-testid="text-welcome">
              Salom, {user?.fullName}!
            </h2>
            <div className="flex flex-wrap gap-2 mt-3 text-sm text-muted-foreground">
              {studentInfo && (
                <>
                  <Badge variant="outline">{studentInfo.groupName}</Badge>
                  <Badge variant="outline">{studentInfo.courseYear}-kurs</Badge>
                  <Badge variant="outline">{studentInfo.departmentName}</Badge>
                </>
              )}
            </div>
            <p className="text-muted-foreground mt-3">
              {format(today, "d-MMMM yyyy, EEEE", { locale: uz })}
            </p>
          </CardContent>
        </Card>

        {alertExams && alertExams.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    Yaqinlashayotgan imtihon!
                  </p>
                  {alertExams.map((exam) => (
                    <div key={exam.id} className="mt-2">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {exam.subjectName} - {format(parseISO(exam.examDate), "d-MMMM", { locale: uz })} soat {exam.startTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Yaqinlashayotgan imtihonlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : upcomingExams && upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {upcomingExams.map((exam) => {
                  const examDateTime = parseISO(`${exam.examDate}T${exam.startTime}`);
                  const isExamTime = !isPast(examDateTime) && differenceInMinutes(examDateTime, new Date()) <= 5;
                  const canStart = exam.status === "active" || isExamTime;

                  return (
                    <div
                      key={exam.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`exam-${exam.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            <span className="font-medium">{exam.subjectName}</span>
                            <Badge variant="outline">{exam.name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            O'qituvchi: {exam.teacherName}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(exam.examDate), "d-MMMM yyyy", { locale: uz })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {exam.startTime}
                            </div>
                            <span>{exam.durationMinutes} daqiqa</span>
                            <span>5 ta savol</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <ExamCountdown examDate={exam.examDate} startTime={exam.startTime} />
                          {canStart ? (
                            <Link href={`/talaba/imtihon/${exam.id}/boshlash`}>
                              <Button data-testid={`button-start-${exam.id}`}>
                                Imtihonni boshlash
                              </Button>
                            </Link>
                          ) : (
                            <Button disabled variant="outline" data-testid={`button-waiting-${exam.id}`}>
                              Vaqt boshlanmadi
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Yaqinlashayotgan imtihon yo'q
                </p>
                <p className="text-sm text-muted-foreground">
                  Yangi imtihonlar e'lon qilinganda bu yerda ko'rinadi
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
