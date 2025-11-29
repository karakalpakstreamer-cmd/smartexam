import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Clock, AlertTriangle, Shield, Send, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ExamSession {
  sessionId: number;
  examId: number;
  examName: string;
  subjectName: string;
  teacherName: string;
  durationMinutes: number;
  startedAt: string;
  endTime: string;
  questions: {
    id: number;
    questionText: string;
    difficulty: string;
    order: number;
  }[];
  savedAnswers: Record<number, string>;
}

interface AntiCheatViolation {
  type: "tab_switch" | "fullscreen_exit" | "copy_paste" | "right_click";
  timestamp: Date;
}

export default function ExamSessionPage() {
  const [, params] = useRoute("/talaba/imtihon/:examId/session");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const examId = params?.examId;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [violations, setViolations] = useState<AntiCheatViolation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolationType, setLastViolationType] = useState<string>("");
  
  const violationsRef = useRef<AntiCheatViolation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading, error } = useQuery<ExamSession>({
    queryKey: ["/api/student/exam-session", examId],
    enabled: !!examId,
    refetchOnWindowFocus: false,
  });

  const saveAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number; answerText: string }) => {
      return apiRequest("POST", `/api/student/exam-session/${session?.sessionId}/answer`, data);
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/student/exam-session/${session?.sessionId}/submit`, { violations: violationsRef.current });
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyatli!",
        description: "Imtihon topshirildi",
      });
      setLocation(`/talaba/imtihon/${examId}/yakunlandi`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Imtihonni topshirishda xatolik",
      });
    },
  });

  const recordViolationMutation = useMutation({
    mutationFn: async (data: { type: string }) => {
      return apiRequest("POST", `/api/student/exam-session/${session?.sessionId}/violation`, data);
    },
  });

  const addViolation = useCallback((type: AntiCheatViolation["type"]) => {
    const violation: AntiCheatViolation = { type, timestamp: new Date() };
    violationsRef.current = [...violationsRef.current, violation];
    setViolations([...violationsRef.current]);
    setLastViolationType(getViolationMessage(type));
    setShowViolationWarning(true);
    
    if (session?.sessionId) {
      recordViolationMutation.mutate({ type });
    }
  }, [session?.sessionId]);

  const getViolationMessage = (type: string) => {
    const messages: Record<string, string> = {
      tab_switch: "Boshqa oynaga o'tish aniqlandi",
      fullscreen_exit: "To'liq ekran rejimidan chiqish aniqlandi",
      copy_paste: "Nusxa olish/qo'yish aniqlandi",
      right_click: "Sichqonchaning o'ng tugmasi bosildi",
    };
    return messages[type] || "Qoidabuzarlik aniqlandi";
  };

  useEffect(() => {
    if (session?.savedAnswers) {
      setAnswers(session.savedAnswers);
    }
  }, [session?.savedAnswers]);

  useEffect(() => {
    if (!session) return;

    const endTime = new Date(session.endTime).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        submitExamMutation.mutate();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || !isFullscreen) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation("tab_switch");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        addViolation("fullscreen_exit");
        setShowFullscreenWarning(true);
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("copy_paste");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("right_click");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === "c" || e.key === "v" || e.key === "x")
      ) {
        e.preventDefault();
        addViolation("copy_paste");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [session, isFullscreen, addViolation]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "To'liq ekran rejimiga o'tib bo'lmadi",
      });
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const saveCurrentAnswer = () => {
    const currentQuestion = session?.questions[currentQuestionIndex];
    if (currentQuestion && answers[currentQuestion.id]) {
      saveAnswerMutation.mutate({
        questionId: currentQuestion.id,
        answerText: answers[currentQuestion.id],
      });
    }
  };

  const goToQuestion = (index: number) => {
    saveCurrentAnswer();
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = () => {
    saveCurrentAnswer();
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    setShowSubmitDialog(false);
    submitExamMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = session?.questions.filter((q) => answers[q.id]?.trim()).length || 0;
  const totalQuestions = session?.questions.length || 0;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const currentQuestion = session?.questions[currentQuestionIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Imtihon yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Imtihon topilmadi</h2>
            <p className="text-muted-foreground mb-4">
              Imtihon sessiyasi topilmadi yoki muddati tugagan
            </p>
            <Button onClick={() => setLocation("/talaba")}>
              Bosh sahifaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <Card className="max-w-lg mx-4">
            <CardContent className="p-6 text-center">
              <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Imtihon xavfsizligi</h2>
              <div className="text-left space-y-3 mb-6">
                <p className="text-muted-foreground">
                  Imtihon davomida quyidagi harakatlar kuzatiladi:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Boshqa oynaga o'tish
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    To'liq ekran rejimidan chiqish
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Nusxa olish/qo'yish
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Sichqonchaning o'ng tugmasi
                  </li>
                </ul>
                <p className="text-sm text-destructive font-medium">
                  Barcha qoidabuzarliklar qayd etiladi va o'qituvchiga yuboriladi.
                </p>
              </div>
              <Button onClick={enterFullscreen} className="w-full" data-testid="button-enter-fullscreen">
                To'liq ekranga o'tish va boshlash
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showViolationWarning && (
        <AlertDialog open={showViolationWarning} onOpenChange={setShowViolationWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Ogohlantirish!
              </AlertDialogTitle>
              <AlertDialogDescription>
                {lastViolationType}. Bu harakat qayd etildi. Iltimos, imtihon qoidalariga rioya qiling.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => {
                setShowViolationWarning(false);
                if (!document.fullscreenElement) {
                  setShowFullscreenWarning(true);
                }
              }}>
                Tushundim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!showFullscreenWarning && (
        <div className="flex flex-col h-screen">
          <header className="bg-card border-b px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-semibold">{session.subjectName}</h1>
              <p className="text-sm text-muted-foreground">{session.examName}</p>
            </div>
            <div className="flex items-center gap-4">
              {violations.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {violations.length} qoidabuzarlik
                </Badge>
              )}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft && timeLeft < 300 ? "bg-destructive/10 text-destructive" : "bg-muted"
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-bold" data-testid="text-time-left">
                  {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </span>
              </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <aside className="w-64 border-r bg-card p-4 overflow-y-auto">
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Jarayon</span>
                  <span>{answeredCount}/{totalQuestions}</span>
                </div>
                <Progress value={progressPercent} />
              </div>
              
              <div className="space-y-2">
                {session.questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(index)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      index === currentQuestionIndex
                        ? "bg-primary text-primary-foreground"
                        : answers[q.id]?.trim()
                        ? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    data-testid={`button-question-${index + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{index + 1}-savol</span>
                      {answers[q.id]?.trim() && index !== currentQuestionIndex && (
                        <Badge variant="secondary" className="text-xs">Javob berilgan</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <main className="flex-1 p-6 overflow-y-auto">
              {currentQuestion && (
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      {currentQuestionIndex + 1}-savol
                    </h2>
                    <Badge variant="outline">
                      {currentQuestion.difficulty === "easy" && "Oson"}
                      {currentQuestion.difficulty === "medium" && "O'rta"}
                      {currentQuestion.difficulty === "hard" && "Qiyin"}
                    </Badge>
                  </div>

                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <p className="text-lg leading-relaxed" data-testid="text-question">
                        {currentQuestion.questionText}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <label className="text-sm font-medium">Javobingiz:</label>
                    <Textarea
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Javobingizni shu yerga yozing..."
                      className="min-h-[200px] text-base"
                      data-testid="textarea-answer"
                    />
                    {saveAnswerMutation.isPending && (
                      <p className="text-xs text-muted-foreground">Saqlanmoqda...</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={() => goToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                      data-testid="button-prev"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Oldingi
                    </Button>

                    {currentQuestionIndex === totalQuestions - 1 ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={submitExamMutation.isPending}
                        data-testid="button-submit"
                      >
                        {submitExamMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Topshirilmoqda...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Topshirish
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => goToQuestion(currentQuestionIndex + 1)}
                        data-testid="button-next"
                      >
                        Keyingi
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Imtihonni topshirish</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < totalQuestions ? (
                <span className="text-destructive">
                  Diqqat! {totalQuestions - answeredCount} ta savolga javob berilmagan.
                </span>
              ) : (
                "Barcha savollarga javob berildi."
              )}
              <br />
              Imtihonni topshirishni tasdiqlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} data-testid="button-confirm-submit">
              Ha, topshirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
