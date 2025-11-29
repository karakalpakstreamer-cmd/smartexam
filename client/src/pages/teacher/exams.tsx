import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Calendar, Clock, Users, MoreVertical, Play, Eye, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { useState } from "react";

interface Exam {
  id: number;
  name: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  groupNames: string[];
  ticketCount: number;
  questionsPerTicket: number;
}

export default function ExamsPage() {
  const { toast } = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/teacher/exams"],
  });

  const startExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      return apiRequest("POST", `/api/exams/${examId}/start`);
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli!", description: "Imtihon boshlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/exams"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Imtihonni boshlashda xatolik" });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      return apiRequest("DELETE", `/api/exams/${examId}`);
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli!", description: "Imtihon o'chirildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/exams"] });
      setIsDeleteOpen(false);
      setSelectedExam(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Imtihonni o'chirishda xatolik" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      scheduled: { variant: "outline", label: "Rejalashtirilgan" },
      active: { variant: "default", label: "Faol" },
      completed: { variant: "secondary", label: "Yakunlangan" },
    };
    const { variant, label } = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleDelete = (exam: Exam) => {
    setSelectedExam(exam);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedExam) {
      deleteExamMutation.mutate(selectedExam.id);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Imtihonlar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Imtihonlar</h2>
            <Link href="/oqituvchi/imtihonlar/yaratish">
              <Button data-testid="button-create-exam">
                <Plus className="w-4 h-4 mr-2" />
                Imtihon yaratish
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : exams && exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((exam) => (
                <Card key={exam.id} data-testid={`exam-${exam.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{exam.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{exam.subjectName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(exam.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {exam.status === "scheduled" && (
                            <DropdownMenuItem
                              onClick={() => startExamMutation.mutate(exam.id)}
                              disabled={startExamMutation.isPending}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Boshlash
                            </DropdownMenuItem>
                          )}
                          {exam.status === "active" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/oqituvchi/imtihonlar/${exam.id}/monitoring`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Monitoring
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {exam.status === "completed" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/oqituvchi/natijalar?exam=${exam.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Natijalar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {exam.status === "scheduled" && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(exam)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              O'chirish
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(exam.examDate), "d-MMMM yyyy", { locale: uz })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {exam.startTime}
                        </div>
                        <span>{exam.durationMinutes} daqiqa</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {exam.groupNames.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {exam.ticketCount} ta bilet
                        </span>
                        <span className="text-muted-foreground">
                          {exam.questionsPerTicket} ta savol
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Hozircha imtihon yo'q
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Yangi imtihon yaratish uchun yuqoridagi tugmani bosing
                </p>
                <Link href="/oqituvchi/imtihonlar/yaratish">
                  <Button data-testid="button-create-exam-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    Imtihon yaratish
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Imtihonni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedExam?.name}" imtihonini o'chirmoqchimisiz? Bu harakat qaytarilmas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteExamMutation.isPending}
            >
              {deleteExamMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  O'chirilmoqda...
                </>
              ) : (
                "O'chirish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
