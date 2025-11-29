import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  Eye,
  Download,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  Award,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ExamResult {
  sessionId: number;
  studentId: number;
  studentName: string;
  examId: number;
  examName: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  violationsCount: number;
  ticketNumber: number;
  subjectName: string;
  groupName: string;
  totalScore: number;
  maxScore: number;
  answersCount: number;
}

interface Exam {
  id: number;
  name: string;
}

export default function ResultsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const examIdParam = searchParams.get("exam");
  
  const [selectedExam, setSelectedExam] = useState<string>(examIdParam || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/teacher/exams"],
  });

  const { data: results, isLoading } = useQuery<ExamResult[]>({
    queryKey: ["/api/teacher/results", selectedExam],
    queryFn: async () => {
      const url = selectedExam && selectedExam !== "all" 
        ? `/api/teacher/results?examId=${selectedExam}`
        : "/api/teacher/results";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (examId: number) => {
      const res = await fetch(`/api/teacher/export/${examId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      return res.json();
    },
    onSuccess: (data) => {
      const csvRows = [
        ["Talaba ID", "Talaba ismi", "Bilet raqami", "Jami ball", "Maksimum ball", "Foiz", "Buzilishlar", "Holat"],
        ...data.results.map((r: any) => [
          r.studentId,
          r.studentName,
          r.ticketNumber,
          r.totalScore,
          r.maxScore,
          r.percentage + "%",
          r.violationsCount,
          r.status === "submitted" ? "Topshirilgan" : r.status,
        ]),
      ];
      
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.exam.name}_natijalar.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Muvaffaqiyatli!", description: "Natijalar eksport qilindi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Eksport qilishda xatolik" });
    },
  });

  const filteredResults = results?.filter((r) =>
    r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.examName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
      submitted: { variant: "default", label: "Topshirilgan", icon: CheckCircle2 },
      in_progress: { variant: "secondary", label: "Jarayonda", icon: Clock },
      not_started: { variant: "outline", label: "Boshlanmagan", icon: Clock },
    };
    const { variant, label, icon: Icon } = variants[status] || { variant: "outline" as const, label: status, icon: Clock };
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = max > 0 ? (score / max) * 100 : 0;
    if (percentage >= 70) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Natijalar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">
              Imtihon natijalari
            </h2>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Talaba yoki imtihon nomi bo'yicha qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full md:w-[250px]" data-testid="select-exam-filter">
                    <SelectValue placeholder="Imtihonni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha imtihonlar</SelectItem>
                    {exams?.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id.toString()}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedExam && selectedExam !== "all" && (
                  <Button
                    variant="outline"
                    onClick={() => exportMutation.mutate(parseInt(selectedExam))}
                    disabled={exportMutation.isPending}
                    data-testid="button-export"
                  >
                    {exportMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    HEMIS eksport
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredResults && filteredResults.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talaba</TableHead>
                      <TableHead>Imtihon</TableHead>
                      <TableHead>Guruh</TableHead>
                      <TableHead>Bilet</TableHead>
                      <TableHead>Ball</TableHead>
                      <TableHead>Buzilishlar</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.sessionId} data-testid={`result-row-${result.sessionId}`}>
                        <TableCell className="font-medium">{result.studentName}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{result.examName}</span>
                            <span className="text-xs text-muted-foreground">{result.subjectName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.groupName}</Badge>
                        </TableCell>
                        <TableCell>#{result.ticketNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={`font-medium ${getScoreColor(result.totalScore, result.maxScore)}`}>
                              {result.totalScore.toFixed(1)} / {result.maxScore}
                            </span>
                            <Progress 
                              value={result.maxScore > 0 ? (result.totalScore / result.maxScore) * 100 : 0} 
                              className="h-1.5 w-16" 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {result.violationsCount > 0 ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              {result.violationsCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(result.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/oqituvchi/natijalar/${result.sessionId}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-${result.sessionId}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Ko'rish
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Natija topilmadi
                </p>
                <p className="text-sm text-muted-foreground">
                  Hali hech qanday imtihon topshirilmagan
                </p>
              </CardContent>
            </Card>
          )}

          {filteredResults && filteredResults.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jami topshirilgan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredResults.filter((r) => r.status === "submitted").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    O'rtacha ball
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(
                      filteredResults
                        .filter((r) => r.status === "submitted" && r.maxScore > 0)
                        .reduce((sum, r) => sum + (r.totalScore / r.maxScore) * 100, 0) /
                        (filteredResults.filter((r) => r.status === "submitted" && r.maxScore > 0).length || 1)
                    ).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Buzilishlar bor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {filteredResults.filter((r) => r.violationsCount > 0).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
