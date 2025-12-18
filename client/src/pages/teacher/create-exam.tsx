import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Trash2, Calendar, Clock, Users, Loader2, ChevronDown, ChevronUp, BookOpen, LayoutDashboard, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
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
        title: "Diqqat!",
        description: "Barcha majburiy maydonlarni to'ldiring",
      });
      return;
    }

    if (selectedGroups.length === 0) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
        description: "Kamida bitta guruh tanlang",
      });
      return;
    }

    if (selectedQuestions.length < questionsPerTicket) {
      toast({
        variant: "destructive",
        title: "Diqqat!",
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
    const variants: Record<string, { className: string; label: string }> = {
      easy: { className: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Oson" },
      medium: { className: "bg-amber-50 text-amber-700 border-amber-200", label: "O'rta" },
      hard: { className: "bg-rose-50 text-rose-700 border-rose-200", label: "Qiyin" },
    };
    const { className, label } = variants[difficulty] || { className: "bg-zinc-100 text-zinc-700 border-zinc-200", label: difficulty };
    return (
      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", className)}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <AppSidebar />
      <div className="flex-1 ml-64 p-8">

        {/* Header */}
        <div className="mb-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent" onClick={() => setLocation("/oqituvchi/imtihonlar")}>
              ← Orqaga
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Yangi Imtihon</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Imtihon parametrlarini o'rnating, guruhlarni biriktiring va savollar bazasini shakllantiring.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">

          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-8">

            {/* Step 1: Basic Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold border border-primary/20">1</div>
                <h3 className="text-lg font-semibold text-foreground">Asosiy ma'lumotlar</h3>
              </div>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground/80">Imtihon nomi</Label>
                    <Input
                      id="name"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="Masalan: 2024-yilgi Yakuniy nazorat"
                      className="h-11 bg-muted/20 focus:bg-background transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground/80">Fan</Label>
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                      <SelectTrigger className="h-11 bg-muted/20 focus:bg-background transition-colors">
                        <SelectValue placeholder="Fanni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-foreground/80">Sana</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="date"
                          type="date"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          className="h-11 pl-10 bg-muted/20 focus:bg-background transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-foreground/80">Boshlash vaqti</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="time"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="h-11 pl-10 bg-muted/20 focus:bg-background transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-foreground/80">Davomiyligi (daqiqa)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min={15}
                        max={180}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                        className="h-11 bg-muted/20 focus:bg-background transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="questionsPerTicket" className="text-foreground/80">Biletdagi savollar soni</Label>
                      <Input
                        id="questionsPerTicket"
                        type="number"
                        min={1}
                        max={10}
                        value={questionsPerTicket}
                        onChange={(e) => setQuestionsPerTicket(parseInt(e.target.value) || 5)}
                        className="h-11 bg-muted/20 focus:bg-background transition-colors"
                      />
                      <p className="text-[11px] text-muted-foreground">Talabaga tushadigan savollar soni</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Step 2: Groups */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold border border-primary/20">2</div>
                <h3 className="text-lg font-semibold text-foreground">Guruhlarni biriktirish</h3>
              </div>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6">
                  {groups && groups.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {groups.map((group) => {
                        const isSelected = selectedGroups.includes(group.id);
                        return (
                          <div
                            key={group.id}
                            onClick={() => toggleGroup(group.id)}
                            className={cn(
                              "relative flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none",
                              isSelected
                                ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                                : "bg-card border-border/50 hover:bg-muted/50 hover:border-border"
                            )}
                          >
                            <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{group.name}</p>
                              <p className="text-xs text-muted-foreground">{group.courseYear}-kurs</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Guruhlar topilmadi</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Step 3: Questions */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold border border-primary/20">3</div>
                  <h3 className="text-lg font-semibold text-foreground">Savollar bazasi</h3>
                </div>
                {selectedSubjectId && questions && questions.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllQuestions} className="text-xs h-8">Barchasi</Button>
                    <Button variant="ghost" size="sm" onClick={deselectAllQuestions} className="text-xs h-8 text-muted-foreground">Tozalash</Button>
                  </div>
                )}
              </div>

              <Card className="border-border/60 shadow-sm min-h-[400px]">
                <CardContent className="p-6">
                  {!selectedSubjectId ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <BookOpen className="w-10 h-10 mb-3 opacity-20" />
                      <p>Savollarni ko'rish uchun avval fanni tanlang</p>
                    </div>
                  ) : questionsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                  ) : groupedQuestions && Object.keys(groupedQuestions).length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-4">
                      {Object.entries(groupedQuestions).map(([lectureId, data]) => (
                        <AccordionItem key={lectureId} value={lectureId} className="border rounded-lg px-4 bg-transparent data-[state=open]:bg-muted/10">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-3 text-left">
                              <span className="font-semibold text-sm">{data.lectureTitle}</span>
                              <Badge variant="secondary" className="font-normal text-xs">{data.questions.length}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 pt-1">
                            <div className="space-y-1">
                              {data.questions.map((q) => {
                                const isSelected = selectedQuestions.includes(q.id);
                                return (
                                  <div
                                    key={q.id}
                                    onClick={() => toggleQuestion(q.id)}
                                    className={cn(
                                      "group flex items-start gap-3 p-3 rounded-md transition-colors cursor-pointer border border-transparent",
                                      isSelected ? "bg-primary/5 border-primary/10" : "hover:bg-muted/50 hover:border-border/30"
                                    )}
                                  >
                                    <div className={cn("mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 group-hover:border-primary/50")}>
                                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <p className={cn("text-sm leading-relaxed", isSelected ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground")}>
                                        {q.questionText}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        {getDifficultyBadge(q.difficulty)}
                                        {q.keywords && q.keywords.length > 0 && <span className="text-[10px] text-muted-foreground/60">{q.keywords.slice(0, 3).join(", ")}</span>}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Bu fan uchun savollar mavjud emas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

          </div>

          {/* Sidebar Sticky Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <Card className="border-border/60 shadow-lg bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-lg">Xulosa</CardTitle>
                  <CardDescription>Yaratilayotgan imtihon ko'rsatkichlari</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" /> Guruhlar
                      </span>
                      <span className="font-semibold">{selectedGroups.length} ta</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Savollar
                      </span>
                      <span className={cn("font-semibold", selectedQuestions.length < questionsPerTicket ? "text-destructive" : "")}>
                        {selectedQuestions.length} ta
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Biletdagi savollar</span>
                      <span className="font-semibold">{questionsPerTicket} ta</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Davomiylik</span>
                      <span className="font-semibold">{durationMinutes} daq</span>
                    </div>
                  </div>

                  {selectedQuestions.length < questionsPerTicket && selectedSubjectId && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Kamida {questionsPerTicket} ta savol tanlashingiz kerak. Hozirda {selectedQuestions.length} ta tanlandi.
                      </span>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-base shadow-lg shadow-primary/20"
                    onClick={handleSubmit}
                    disabled={createExamMutation.isPending}
                  >
                    {createExamMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Yaratilmoqda...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Imtihonni yaratish
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

