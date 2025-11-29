import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, Trash2, Loader2, CheckCircle, AlertCircle, FileIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import type { Lecture, Subject } from "@shared/schema";

interface LectureWithDetails extends Lecture {
  subjectName: string;
}

export default function LecturesPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<LectureWithDetails | null>(null);
  const { toast } = useToast();

  const { data: lectures, isLoading } = useQuery<LectureWithDetails[]>({
    queryKey: ["/api/teacher/lectures"],
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/teacher/subjects"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/lectures/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/lectures"] });
      setIsDeleteOpen(false);
      setSelectedLecture(null);
      toast({ title: "Muvaffaqiyatli!", description: "Leksiya o'chirildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Leksiya o'chirishda xatolik" });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Xatolik!", description: "Fayl hajmi 10MB dan oshmasligi kerak" });
        return;
      }
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.(pdf|docx?)$/i, ""));
      }
    }
  }, [uploadTitle, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle || !uploadSubjectId) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Barcha maydonlarni to'ldiring" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);
    formData.append("subjectId", uploadSubjectId);

    try {
      const response = await fetch("/api/lectures/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");

      setUploadProgress(50);
      setIsUploading(false);
      setIsGenerating(true);

      const result = await response.json();

      setUploadProgress(100);
      setIsGenerating(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadSubjectId("");

      queryClient.invalidateQueries({ queryKey: ["/api/teacher/lectures"] });
      toast({
        title: "Muvaffaqiyatli!",
        description: `${result.questionsCount || 0} ta savol yaratildi`,
      });
    } catch (error) {
      setIsUploading(false);
      setIsGenerating(false);
      toast({ variant: "destructive", title: "Xatolik!", description: "Leksiya yuklashda xatolik" });
    }
  };

  const handleDelete = (lecture: LectureWithDetails) => {
    setSelectedLecture(lecture);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedLecture) return;
    deleteMutation.mutate(selectedLecture.id);
  };

  const filteredLectures = lectures?.filter(
    (l) => selectedSubject === "all" || l.subjectId === parseInt(selectedSubject)
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Leksiyalar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Leksiyalar</h2>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]" data-testid="select-subject-filter">
                <SelectValue placeholder="Fan tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha fanlar</SelectItem>
                {subjects?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Leksiya yuklash</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fan *</Label>
                    <Select value={uploadSubjectId} onValueChange={setUploadSubjectId}>
                      <SelectTrigger data-testid="select-upload-subject">
                        <SelectValue placeholder="Fan tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Leksiya nomi *</Label>
                    <Input
                      id="title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="1-mavzu: Kirish"
                      data-testid="input-lecture-title"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    data-testid="dropzone"
                  >
                    <input {...getInputProps()} />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileIcon className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{uploadFile.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          {isDragActive ? "Faylni shu yerga tashlang" : "PDF yoki Word faylni shu yerga tashlang"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">yoki</p>
                        <Button variant="outline" className="mt-2" type="button">
                          Faylni tanlash
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">Maksimum 10MB - PDF, DOCX</p>
                      </>
                    )}
                  </div>

                  {(isUploading || isGenerating) && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-center text-muted-foreground">
                        {isUploading ? "Yuklanmoqda..." : "Savollar yaratilmoqda..."}
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleUpload}
                    disabled={!uploadFile || !uploadTitle || !uploadSubjectId || isUploading || isGenerating}
                    data-testid="button-upload"
                  >
                    {isUploading || isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isUploading ? "Yuklanmoqda..." : "Savollar yaratilmoqda..."}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Yuklash
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Yuklangan leksiyalar</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredLectures && filteredLectures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLectures.map((lecture) => (
                    <div
                      key={lecture.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`lecture-${lecture.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          lecture.fileType === "pdf" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lecture.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{lecture.fileName}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {lecture.subjectName}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(lecture.fileSize)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {lecture.uploadedAt && formatDistanceToNow(new Date(lecture.uploadedAt), {
                                addSuffix: true,
                                locale: uz,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lecture.questionsGenerated ? (
                            <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle className="w-3 h-3" />
                              {lecture.questionsCount} ta savol
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Jarayonda
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(lecture)}
                            data-testid={`button-delete-${lecture.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Hozircha leksiya yo'q
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Yuqoridagi forma orqali leksiya yuklang
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leksiyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedLecture?.title}" leksiyasini o'chirmoqchimisiz? Bu bilan unga tegishli barcha savollar ham o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
