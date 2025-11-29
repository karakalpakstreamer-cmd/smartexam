import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Save,
  X,
  Loader2,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface FeedbackCriteria {
  score: number;
  comment: string;
}

interface AIFeedback {
  score: number;
  maxScore: number;
  feedback: {
    relevance: FeedbackCriteria;
    completeness: FeedbackCriteria;
    clarity: FeedbackCriteria;
    keywords: FeedbackCriteria;
    logic: FeedbackCriteria;
  };
  overallComment: string;
}

interface Answer {
  id: number;
  questionId: number;
  questionText: string;
  sampleAnswer: string | null;
  keywords: string[];
  answerText: string | null;
  aiScore: string | null;
  aiFeedback: AIFeedback | null;
  manualScore: string | null;
  manualComment: string | null;
  answeredAt: string | null;
}

interface SessionDetails {
  sessionId: number;
  studentId: number;
  studentName: string;
  examId: number;
  examName: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  violationsCount: number;
  violationDetails: { type: string; timestamp: string }[] | null;
  ticketNumber: number;
  subjectName: string;
  groupName: string;
  answers: Answer[];
}

interface EditingAnswer {
  id: number;
  score: string;
  comment: string;
}

export default function SessionDetailsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toast } = useToast();
  const [editingAnswer, setEditingAnswer] = useState<EditingAnswer | null>(null);

  const { data: session, isLoading } = useQuery<SessionDetails>({
    queryKey: ["/api/teacher/results", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/results/${sessionId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ answerId, score, comment }: { answerId: number; score: number; comment: string }) => {
      return apiRequest("PATCH", `/api/teacher/answers/${answerId}/score`, { score, comment });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli!", description: "Ball yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/results", sessionId] });
      setEditingAnswer(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Ballni yangilashda xatolik" });
    },
  });

  const handleEdit = (answer: Answer) => {
    setEditingAnswer({
      id: answer.id,
      score: answer.manualScore || answer.aiScore || "0",
      comment: answer.manualComment || "",
    });
  };

  const handleSave = () => {
    if (editingAnswer) {
      updateScoreMutation.mutate({
        answerId: editingAnswer.id,
        score: parseFloat(editingAnswer.score) || 0,
        comment: editingAnswer.comment,
      });
    }
  };

  const getTotalScore = () => {
    if (!session) return { total: 0, max: 0 };
    const total = session.answers.reduce((sum, a) => {
      const score = a.manualScore ? parseFloat(a.manualScore) : parseFloat(a.aiScore || "0");
      return sum + score;
    }, 0);
    const max = session.answers.length * 15;
    return { total, max };
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = max > 0 ? (score / max) * 100 : 0;
    if (percentage >= 70) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getCriteriaLabel = (key: string) => {
    const labels: Record<string, string> = {
      relevance: "Tegishlilik",
      completeness: "To'liqlik",
      clarity: "Aniqlik",
      keywords: "Kalit so'zlar",
      logic: "Mantiqiylik",
    };
    return labels[key] || key;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 ml-[260px]">
          <Topbar title="Natija tafsilotlari" />
          <main className="p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 ml-[260px]">
          <Topbar title="Natija tafsilotlari" />
          <main className="p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium text-muted-foreground">
                  Natija topilmadi
                </p>
                <Link href="/oqituvchi/natijalar">
                  <Button variant="outline" className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Orqaga qaytish
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const { total, max } = getTotalScore();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Natija tafsilotlari" />
        <main className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/oqituvchi/natijalar">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Orqaga
              </Button>
            </Link>
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">
              {session.studentName}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Imtihon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{session.examName}</p>
                <p className="text-sm text-muted-foreground">{session.subjectName}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Guruh / Bilet
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge variant="outline">{session.groupName}</Badge>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium">#{session.ticketNumber}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Jami ball
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Award className={`w-8 h-8 ${getScoreColor(total, max)}`} />
                  <div>
                    <p className={`text-2xl font-bold ${getScoreColor(total, max)}`}>
                      {total.toFixed(1)} / {max}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {max > 0 ? ((total / max) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {session.violationsCount > 0 && session.violationDetails && (
            <Card className="mb-6 border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Buzilishlar ({session.violationsCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {session.violationDetails.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>
                        {v.type === "tab_switch" && "Oyna almashtirildi"}
                        {v.type === "copy" && "Nusxalash urinishi"}
                        {v.type === "paste" && "Qo'yish urinishi"}
                        {v.type === "fullscreen_exit" && "To'liq ekrandan chiqildi"}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(v.timestamp), "HH:mm:ss", { locale: uz })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Javoblar</h3>
            <Accordion type="single" collapsible className="space-y-4">
              {session.answers.map((answer, index) => {
                const aiScore = parseFloat(answer.aiScore || "0");
                const finalScore = answer.manualScore ? parseFloat(answer.manualScore) : aiScore;
                const isEditing = editingAnswer?.id === answer.id;
                const feedback = answer.aiFeedback;

                return (
                  <AccordionItem
                    key={answer.id}
                    value={`answer-${answer.id}`}
                    className="border rounded-lg px-0"
                    data-testid={`answer-${answer.id}`}
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Savol {index + 1}</span>
                          {answer.manualScore && (
                            <Badge variant="secondary" className="text-xs">
                              Qo'lda baholangan
                            </Badge>
                          )}
                        </div>
                        <div className={`font-bold ${getScoreColor(finalScore, 15)}`}>
                          {finalScore.toFixed(1)} / 15
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Savol:</h4>
                          <p>{answer.questionText}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Talaba javobi:</h4>
                          <div className="bg-background border p-4 rounded-lg">
                            {answer.answerText ? (
                              <p className="whitespace-pre-wrap">{answer.answerText}</p>
                            ) : (
                              <p className="text-muted-foreground italic">Javob berilmagan</p>
                            )}
                          </div>
                        </div>

                        {answer.sampleAnswer && (
                          <div>
                            <h4 className="font-medium mb-2">Namuna javob:</h4>
                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                              <p className="whitespace-pre-wrap">{answer.sampleAnswer}</p>
                            </div>
                          </div>
                        )}

                        {feedback && (
                          <div>
                            <h4 className="font-medium mb-2">AI baholashi:</h4>
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {Object.entries(feedback.feedback || {}).map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {getCriteriaLabel(key)}
                                    </p>
                                    <p className={`text-lg font-bold ${getScoreColor((value as FeedbackCriteria).score, 3)}`}>
                                      {(value as FeedbackCriteria).score}/3
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {(value as FeedbackCriteria).comment}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <Separator />
                              <div>
                                <p className="text-sm font-medium mb-1">Umumiy izoh:</p>
                                <p className="text-sm text-muted-foreground">{feedback.overallComment}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <Separator />

                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="manual-score">Qo'lda ball (0-15)</Label>
                                <Input
                                  id="manual-score"
                                  type="number"
                                  min="0"
                                  max="15"
                                  step="0.5"
                                  value={editingAnswer.score}
                                  onChange={(e) => setEditingAnswer({ ...editingAnswer, score: e.target.value })}
                                  data-testid="input-manual-score"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="manual-comment">Izoh</Label>
                              <Textarea
                                id="manual-comment"
                                value={editingAnswer.comment}
                                onChange={(e) => setEditingAnswer({ ...editingAnswer, comment: e.target.value })}
                                placeholder="O'qituvchi izohi..."
                                data-testid="input-manual-comment"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={handleSave}
                                disabled={updateScoreMutation.isPending}
                                data-testid="button-save-score"
                              >
                                {updateScoreMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4 mr-2" />
                                )}
                                Saqlash
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setEditingAnswer(null)}
                                data-testid="button-cancel-edit"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Bekor qilish
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              {answer.manualComment && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">O'qituvchi izohi:</span> {answer.manualComment}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(answer)}
                              data-testid={`button-edit-${answer.id}`}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Ballni o'zgartirish
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </main>
      </div>
    </div>
  );
}
