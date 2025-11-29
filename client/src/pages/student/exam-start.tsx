import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Clock, Users, AlertTriangle, Play, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentNavbar } from "@/components/layout/student-navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface ExamDetails {
  id: number;
  name: string;
  subjectName: string;
  teacherName: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  questionsCount: number;
  status: string;
  canStart: boolean;
}

export default function ExamStartPage() {
  const [, params] = useRoute("/talaba/imtihon/:examId/boshlash");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const examId = params?.examId;

  const { data: exam, isLoading } = useQuery<ExamDetails>({
    queryKey: ["/api/student/exam", examId],
    enabled: !!examId,
  });

  const startExamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/student/exam/${examId}/start`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      setLocation(`/talaba/imtihon/${examId}/session`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: error.message || "Imtihonni boshlashda xatolik",
      });
    },
  });

  const handleStart = () => {
    startExamMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNavbar />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-background">
        <StudentNavbar />
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Imtihon topilmadi</h2>
              <p className="text-muted-foreground mb-4">
                Ushbu imtihon mavjud emas yoki sizga ruxsat berilmagan
              </p>
              <Button onClick={() => setLocation("/talaba")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ortga qaytish
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNavbar />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/talaba")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ortga
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{exam.subjectName}</CardTitle>
                <p className="text-muted-foreground mt-1">{exam.name}</p>
              </div>
              <Badge variant={exam.status === "active" ? "default" : "outline"}>
                {exam.status === "active" ? "Faol" : "Rejalashtirilgan"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">O'qituvchi</p>
                <p className="font-medium">{exam.teacherName}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sana</p>
                <p className="font-medium">
                  {format(new Date(exam.examDate), "d-MMMM yyyy", { locale: uz })}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Davomiyligi</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {exam.durationMinutes} daqiqa
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Savollar soni</p>
                <p className="font-medium">{exam.questionsCount} ta</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Muhim qoidalar
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  Imtihon to'liq ekran rejimida o'tkaziladi
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  Boshqa oynaga o'tish, nusxa olish va qo'yish taqiqlanadi
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  Barcha qoidabuzarliklar qayd etiladi
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">4.</span>
                  Vaqt tugagandan so'ng imtihon avtomatik topshiriladi
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">5.</span>
                  Javoblar avtomatik saqlanadi
                </li>
              </ul>
            </div>

            {exam.canStart ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleStart}
                disabled={startExamMutation.isPending}
                data-testid="button-start-exam"
              >
                {startExamMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Imtihonni boshlash
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground">
                  Imtihon hali boshlanmadi. Iltimos, belgilangan vaqtni kuting.
                </p>
                <p className="font-medium mt-2">
                  Boshlanish vaqti: {exam.startTime}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
