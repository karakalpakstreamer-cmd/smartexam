import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Trash2, Calendar, Clock, Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Subject, Question, Group } from "@shared/schema";

interface QuestionWithLecture extends Question {
  lectureTitle: string;
}

export default function CreateExamPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [examName, setExamName] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questionsPerTicket, setQuestionsPerTicket] = useState(5);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [expandedLecture, setExpandedLecture] = useState<number | null>(null);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/teacher/subjects"],
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<QuestionWithLecture[]>({
    queryKey: ["/api/teacher/questions", selectedSubjectId],
    enabled: !!selectedSubjectId,
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      subjectId: number;
      examDate: string;
      startTime: string;
      durationMinutes: number;
      questionsPerTicket: number;
      groupIds: number[];
      questionIds: number[];
    }) => {
      const res = await apiRequest("POST", "/api/exams", data);
      return res.json();
    },
    onSuccess: (data: { success: boolean; examId: number; ticketCount: number }) => {
      toast({
        title: "Muvaffaqiyatli!",
        description: `Imtihon yaratildi. ${data.ticketCount} ta bilet generatsiya qilindi.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/today-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/exams"] });
      setLocation("/oqituvchi/imtihonlar");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Imtihon yaratishda xatolik yuz berdi",
      });
    },
  });

  const handleSubmit = () => {
    if (!examName || !selectedSubjectId || !examDate || !startTime) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Barcha majburiy maydonlarni to'ldiring",
      });
      return;
    }

    if (selectedGroups.length === 0) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Kamida bitta guruh tanlang",
      });
      return;
    }

    if (selectedQuestions.length < questionsPerTicket) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: `Kamida ${questionsPerTicket} ta savol tanlang (biletdagi savollar soni)`,
      });
      return;
    }

    createExamMutation.mutate({
      name: examName,
      subjectId: parseInt(selectedSubjectId),
      examDate,
      startTime,
      durationMinutes,
      questionsPerTicket,
      groupIds: selectedGroups,
      questionIds: selectedQuestions,
    });
  };

  const toggleGroup = (groupId: number) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleQuestion = (questionId: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAllQuestions = () => {
    if (questions) {
      setSelectedQuestions(questions.map((q) => q.id));
    }
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions([]);
  };

  const groupedQuestions = questions?.reduce((acc, q) => {
    if (!acc[q.lectureId]) {
      acc[q.lectureId] = {
        lectureTitle: q.lectureTitle,
        questions: [],
      };
    }
    acc[q.lectureId].questions.push(q);
    return acc;
  }, {} as Record<number, { lectureTitle: string; questions: QuestionWithLecture[] }>);

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      easy: { variant: "secondary", label: "Oson" },
      medium: { variant: "default", label: "O'rta" },
      hard: { variant: "destructive", label: "Qiyin" },
    };
    const { variant, label } = variants[difficulty] || { variant: "outline" as const, label: difficulty };
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Imtihon yaratish" />
        <main className="p-6">
          <h2 className="text-2xl font-semibold mb-6" data-testid="text-page-heading">
            Yangi imtihon yaratish
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Asosiy ma'lumotlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Imtihon nomi *</Label>
                      <Input
                        id="name"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="Yakuniy imtihon"
                        data-testid="input-exam-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fan *</Label>
                      <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="Fan tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects?.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Sana *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="date"
                          type="date"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          className="pl-10"
                          data-testid="input-exam-date"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Boshlash vaqti *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="time"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="pl-10"
                          data-testid="input-exam-time"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Davomiyligi (daqiqa)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min={15}
                        max={180}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                        data-testid="input-duration"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="questionsPerTicket">Biletdagi savollar soni</Label>
                    <Input
                      id="questionsPerTicket"
                      type="number"
                      min={1}
                      max={10}
                      value={questionsPerTicket}
                      onChange={(e) => setQuestionsPerTicket(parseInt(e.target.value) || 5)}
                      data-testid="input-questions-count"
                    />
                    <p className="text-xs text-muted-foreground">
                      Har bir talaba uchun tasodifiy tanlanadigan savollar soni
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-lg">Savollar bazasi</CardTitle>
                  {selectedSubjectId && questions && questions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllQuestions} data-testid="button-select-all">
                        Barchasini tanlash
                      </Button>
                      <Button variant="ghost" size="sm" onClick={deselectAllQuestions} data-testid="button-deselect-all">
                        Tozalash
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedSubjectId ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Avval fanni tanlang
                    </p>
                  ) : questionsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : groupedQuestions && Object.keys(groupedQuestions).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(groupedQuestions).map(([lectureId, data]) => (
                        <div key={lectureId} className="border rounded-lg">
                          <button
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedLecture(
                              expandedLecture === parseInt(lectureId) ? null : parseInt(lectureId)
                            )}
                            type="button"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{data.lectureTitle}</span>
                              <Badge variant="outline">{data.questions.length} ta savol</Badge>
                            </div>
                            {expandedLecture === parseInt(lectureId) ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          {expandedLecture === parseInt(lectureId) && (
                            <div className="border-t p-4 space-y-3">
                              {data.questions.map((q) => (
                                <div
                                  key={q.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    selectedQuestions.includes(q.id)
                                      ? "border-primary bg-primary/5"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={selectedQuestions.includes(q.id)}
                                    onCheckedChange={() => toggleQuestion(q.id)}
                                    id={`q-${q.id}`}
                                    data-testid={`checkbox-question-${q.id}`}
                                  />
                                  <div className="flex-1">
                                    <label
                                      htmlFor={`q-${q.id}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {q.questionText}
                                    </label>
                                    <div className="flex items-center gap-2 mt-2">
                                      {getDifficultyBadge(q.difficulty)}
                                      {q.keywords && q.keywords.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          Kalit so'zlar: {q.keywords.slice(0, 3).join(", ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      Bu fan uchun savollar topilmadi. Avval leksiya yuklang.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Guruhlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groups && groups.length > 0 ? (
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            selectedGroups.includes(group.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleGroup(group.id)}
                        >
                          <Checkbox
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={() => toggleGroup(group.id)}
                            id={`g-${group.id}`}
                            data-testid={`checkbox-group-${group.id}`}
                          />
                          <label htmlFor={`g-${group.id}`} className="flex-1 cursor-pointer">
                            <span className="font-medium">{group.name}</span>
                            <p className="text-xs text-muted-foreground">{group.courseYear}-kurs</p>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground text-sm">
                      Guruhlar topilmadi
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Xulosa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tanlangan guruhlar:</span>
                    <span className="font-medium">{selectedGroups.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tanlangan savollar:</span>
                    <span className="font-medium">{selectedQuestions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biletdagi savollar:</span>
                    <span className="font-medium">{questionsPerTicket}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Davomiylik:</span>
                    <span className="font-medium">{durationMinutes} daqiqa</span>
                  </div>
                  {selectedQuestions.length < questionsPerTicket && selectedSubjectId && (
                    <p className="text-xs text-destructive mt-2">
                      Kamida {questionsPerTicket} ta savol tanlash kerak
                    </p>
                  )}
                </CardContent>
              </Card>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={createExamMutation.isPending}
                data-testid="button-create-exam"
              >
                {createExamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Imtihon yaratish
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
