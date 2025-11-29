import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Clock, AlertTriangle, Play, Loader2, ArrowLeft, User, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { StudentNavbar } from "@/components/layout/student-navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface StudentInfo {
  fullName: string;
  userId: string;
  groupName: string;
  facultyName: string;
}

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
  studentInfo: StudentInfo;
}

export default function ExamStartPage() {
  const [, params] = useRoute("/talaba/imtihon/:examId/boshlash");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const examId = params?.examId;
  const [acceptedRules, setAcceptedRules] = useState(false);

  const { data: exam, isLoading } = useQuery<ExamDetails>({
    queryKey: ["/api/student/exam", examId],
    enabled: !!examId,
  });

  const startExamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/student/exam/${examId}/start`, {});
      return res.json();
    },
    onSuccess: () => {
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
    if (!acceptedRules) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Imtihon qoidalarini qabul qilishingiz kerak",
      });
      return;
    }
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
          onClick={() => setLocation("/talaba/imtihonlar")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ortga
        </Button>

        <Card className="mb-6">
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
          </CardContent>
        </Card>

        {exam.studentInfo && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Shaxsni tasdiqlash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">To'liq ism</p>
                  <p className="font-semibold">{exam.studentInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID raqam</p>
                  <p className="font-semibold font-mono">{exam.studentInfo.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guruh</p>
                  <p className="font-semibold">{exam.studentInfo.groupName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fakultet</p>
                  <p className="font-semibold">{exam.studentInfo.facultyName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Imtihon qoidalari
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Imtihon davomiyligi <strong>{exam.durationMinutes} daqiqa</strong>. Vaqt tugaganda javoblar avtomatik yuboriladi.</span>
              </li>
              <li className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Imtihon to'liq ekran rejimida o'tkaziladi. Ekrandan chiqish <strong>qoidabuzarlik</strong> hisoblanadi.</span>
              </li>
              <li className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Boshqa oynaga o'tish (tab switching) <strong>taqiqlanadi</strong> va qayd etiladi.</span>
              </li>
              <li className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Nusxalash va qo'yish (copy-paste) <strong>bloklangan</strong>.</span>
              </li>
              <li className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <span className="text-destructive font-medium">3 ta qoidabuzarlik = diskvalifikatsiya!</span>
              </li>
            </ul>

            <div className="mt-6 p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-rules"
                  checked={acceptedRules}
                  onCheckedChange={(checked) => setAcceptedRules(checked as boolean)}
                  data-testid="checkbox-accept-rules"
                />
                <label htmlFor="accept-rules" className="text-sm cursor-pointer leading-relaxed">
                  Men <strong>{exam.studentInfo?.fullName || "talaba"}</strong>man va yuqoridagi imtihon qoidalarini o'qib chiqdim, ularga roziman.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {exam.canStart ? (
          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={!acceptedRules || startExamMutation.isPending}
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
                Tasdiqlash va boshlash
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
      </main>
    </div>
  );
}
