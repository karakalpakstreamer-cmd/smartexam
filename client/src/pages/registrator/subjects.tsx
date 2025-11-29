import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subject, Department, Faculty } from "@shared/schema";

interface SubjectWithStats extends Subject {
  departmentName: string;
  facultyName: string;
  teachersCount: number;
}

export default function SubjectsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithStats | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", credits: "3", facultyId: "", departmentId: "" });
  const { toast } = useToast();

  const { data: subjects, isLoading } = useQuery<SubjectWithStats[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const filteredDepartments = departments?.filter(
    (dept) => !formData.facultyId || dept.facultyId === parseInt(formData.facultyId)
  );

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; credits: number; departmentId: number }) => {
      return apiRequest("POST", "/api/subjects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsAddOpen(false);
      setFormData({ name: "", code: "", credits: "3", facultyId: "", departmentId: "" });
      toast({ title: "Muvaffaqiyatli!", description: "Fan qo'shildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Fan qo'shishda xatolik" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; code: string; credits: number; departmentId: number } }) => {
      return apiRequest("PATCH", `/api/subjects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsEditOpen(false);
      setSelectedSubject(null);
      toast({ title: "Muvaffaqiyatli!", description: "Fan yangilandi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Fan yangilashda xatolik" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsDeleteOpen(false);
      setSelectedSubject(null);
      toast({ title: "Muvaffaqiyatli!", description: "Fan o'chirildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Fan o'chirishda xatolik" });
    },
  });

  const handleAdd = () => {
    setFormData({ name: "", code: "", credits: "3", facultyId: "", departmentId: "" });
    setIsAddOpen(true);
  };

  const handleEdit = (subject: SubjectWithStats) => {
    const dept = departments?.find((d) => d.id === subject.departmentId);
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      credits: (subject.credits || 3).toString(),
      facultyId: dept?.facultyId?.toString() || "",
      departmentId: subject.departmentId?.toString() || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (subject: SubjectWithStats) => {
    setSelectedSubject(subject);
    setIsDeleteOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.code || !formData.departmentId) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Barcha maydonlarni to'ldiring" });
      return;
    }
    createMutation.mutate({
      name: formData.name,
      code: formData.code,
      credits: parseInt(formData.credits),
      departmentId: parseInt(formData.departmentId),
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedSubject || !formData.name || !formData.code) return;
    updateMutation.mutate({
      id: selectedSubject.id,
      data: {
        name: formData.name,
        code: formData.code,
        credits: parseInt(formData.credits),
        departmentId: parseInt(formData.departmentId),
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedSubject) return;
    deleteMutation.mutate(selectedSubject.id);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Fanlar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Fanlar</h2>
            <Button onClick={handleAdd} data-testid="button-add-subject">
              <Plus className="w-4 h-4 mr-2" />
              Fan qo'shish
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : subjects && subjects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Fan nomi</TableHead>
                      <TableHead>Yo'nalish</TableHead>
                      <TableHead>Fakultet</TableHead>
                      <TableHead className="text-center">Kreditlar</TableHead>
                      <TableHead className="text-center">O'qituvchilar</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow key={subject.id} data-testid={`row-subject-${subject.id}`}>
                        <TableCell className="font-mono font-medium">{subject.code}</TableCell>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>{subject.departmentName || "-"}</TableCell>
                        <TableCell>{subject.facultyName || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{subject.credits}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{subject.teachersCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(subject)}
                              data-testid={`button-edit-${subject.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(subject)}
                              data-testid={`button-delete-${subject.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Hozircha fan yo'q
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fan qo'shish uchun tugmani bosing
                  </p>
                  <Button onClick={handleAdd} data-testid="button-add-subject-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    Fan qo'shish
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fan qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fan nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Matematika"
                data-testid="input-subject-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="MAT101"
                data-testid="input-subject-code"
              />
            </div>
            <div className="space-y-2">
              <Label>Fakultet *</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v, departmentId: "" })}>
                <SelectTrigger data-testid="select-faculty">
                  <SelectValue placeholder="Fakultet tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {faculties?.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Yo'nalish *</Label>
              <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                <SelectTrigger data-testid="select-department">
                  <SelectValue placeholder="Yo'nalish tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Kreditlar</Label>
              <Select value={formData.credits} onValueChange={(v) => setFormData({ ...formData, credits: v })}>
                <SelectTrigger data-testid="select-credits">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <SelectItem key={c} value={c.toString()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel">
              Bekor qilish
            </Button>
            <Button onClick={handleSubmitAdd} disabled={createMutation.isPending} data-testid="button-save">
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fanni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Fan nomi *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Kod *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                data-testid="input-edit-code"
              />
            </div>
            <div className="space-y-2">
              <Label>Fakultet *</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v, departmentId: "" })}>
                <SelectTrigger data-testid="select-edit-faculty">
                  <SelectValue placeholder="Fakultet tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {faculties?.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Yo'nalish *</Label>
              <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                <SelectTrigger data-testid="select-edit-department">
                  <SelectValue placeholder="Yo'nalish tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kreditlar</Label>
              <Select value={formData.credits} onValueChange={(v) => setFormData({ ...formData, credits: v })}>
                <SelectTrigger data-testid="select-edit-credits">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <SelectItem key={c} value={c.toString()}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-edit-cancel">
              Bekor qilish
            </Button>
            <Button onClick={handleSubmitEdit} disabled={updateMutation.isPending} data-testid="button-edit-save">
              {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fanni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedSubject?.name}" fanini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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
