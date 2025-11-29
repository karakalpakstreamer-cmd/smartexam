import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { CheckCircle2, Clock, FileText, Home, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentNavbar } from "@/components/layout/student-navbar";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface ExamResult {
  examName: string;
  subjectName: string;
  submittedAt: string;
  answeredCount: number;
  totalQuestions: number;
  status: string;
}

export default function ExamSuccessPage() {
  const [, params] = useRoute("/talaba/imtihon/:examId/yakunlandi");
  const [, setLocation] = useLocation();
  const examId = params?.examId;

  const { data: result, isLoading } = useQuery<ExamResult>({
    queryKey: ["/api/student/exam-result", examId],
    enabled: !!examId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNavbar />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Skeleton className="h-80 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavbar />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="overflow-hidden">
          <div className="bg-green-500 dark:bg-green-600 p-6 text-white text-center">
            <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-2xl font-bold" data-testid="text-success-title">
              Imtihon muvaffaqiyatli topshirildi!
            </h1>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="text-center text-muted-foreground">
              <p>Sizning javoblaringiz qabul qilindi va baholash uchun yuborildi.</p>
            </div>

            {result && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fan</p>
                    <p className="font-medium" data-testid="text-subject-name">{result.subjectName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Imtihon</p>
                    <p className="font-medium" data-testid="text-exam-name">{result.examName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Topshirilgan vaqt</p>
                    <p className="font-medium" data-testid="text-submit-time">
                      {result.submittedAt 
                        ? format(new Date(result.submittedAt), "d-MMMM yyyy, HH:mm", { locale: uz })
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Javoblangan savollar</p>
                    <p className="font-medium" data-testid="text-answers-count">
                      {result.answeredCount} / {result.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Natijalar o'qituvchi tomonidan tekshirilgandan so'ng e'lon qilinadi.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setLocation("/talaba/imtihonlar")}
                  data-testid="button-exams-list"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Imtihonlar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setLocation("/talaba")}
                  data-testid="button-home"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Bosh sahifa
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
