import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Faculty } from "@shared/schema";

interface FacultyWithStats extends Faculty {
  departmentsCount: number;
  teachersCount: number;
  studentsCount: number;
}

export default function FacultiesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyWithStats | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const { toast } = useToast();

  const { data: faculties, isLoading } = useQuery<FacultyWithStats[]>({
    queryKey: ["/api/faculties"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      return apiRequest("POST", "/api/faculties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      setIsAddOpen(false);
      setFormData({ name: "", code: "" });
      toast({ title: "Muvaffaqiyatli!", description: "Fakultet qo'shildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Fakultet qo'shishda xatolik" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; code: string } }) => {
      return apiRequest("PATCH", `/api/faculties/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      setIsEditOpen(false);
      setSelectedFaculty(null);
      toast({ title: "Muvaffaqiyatli!", description: "Fakultet yangilandi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Fakultet yangilashda xatolik" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/faculties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faculties"] });
      setIsDeleteOpen(false);
      setSelectedFaculty(null);
      toast({ title: "Muvaffaqiyatli!", description: "Fakultet o'chirildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Fakultet o'chirishda xatolik" });
    },
  });

  const handleAdd = () => {
    setFormData({ name: "", code: "" });
    setIsAddOpen(true);
  };

  const handleEdit = (faculty: FacultyWithStats) => {
    setSelectedFaculty(faculty);
    setFormData({ name: faculty.name, code: faculty.code });
    setIsEditOpen(true);
  };

  const handleDelete = (faculty: FacultyWithStats) => {
    setSelectedFaculty(faculty);
    setIsDeleteOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.code) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Barcha maydonlarni to'ldiring" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!selectedFaculty || !formData.name || !formData.code) return;
    updateMutation.mutate({ id: selectedFaculty.id, data: formData });
  };

  const handleConfirmDelete = () => {
    if (!selectedFaculty) return;
    deleteMutation.mutate(selectedFaculty.id);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Fakultetlar" />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Fakultetlar</h2>
            <Button onClick={handleAdd} data-testid="button-add-faculty">
              <Plus className="w-4 h-4 mr-2" />
              Fakultet qo'shish
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
              ) : faculties && faculties.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Fakultet nomi</TableHead>
                      <TableHead className="text-center">Yo'nalishlar</TableHead>
                      <TableHead className="text-center">O'qituvchilar</TableHead>
                      <TableHead className="text-center">Talabalar</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faculties.map((faculty) => (
                      <TableRow key={faculty.id} data-testid={`row-faculty-${faculty.id}`}>
                        <TableCell className="font-mono font-medium">{faculty.code}</TableCell>
                        <TableCell>{faculty.name}</TableCell>
                        <TableCell className="text-center">{faculty.departmentsCount}</TableCell>
                        <TableCell className="text-center">{faculty.teachersCount}</TableCell>
                        <TableCell className="text-center">{faculty.studentsCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(faculty)}
                              data-testid={`button-edit-${faculty.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(faculty)}
                              data-testid={`button-delete-${faculty.id}`}
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
                  <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Hozircha fakultet yo'q
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Fakultet qo'shish uchun tugmani bosing
                  </p>
                  <Button onClick={handleAdd} data-testid="button-add-faculty-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    Fakultet qo'shish
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
            <DialogTitle>Fakultet qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fakultet nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Iqtisodiyot fakulteti"
                data-testid="input-faculty-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="IQTISOD"
                data-testid="input-faculty-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} data-testid="button-cancel">
              Bekor qilish
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={createMutation.isPending}
              data-testid="button-save"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fakultetni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Fakultet nomi *</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-edit-cancel">
              Bekor qilish
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
              data-testid="button-edit-save"
            >
              {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fakultetni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedFaculty?.name}" fakultetini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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
