import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Department, Faculty } from "@shared/schema";

interface DepartmentWithStats extends Department {
  facultyName: string;
  groupsCount: number;
}

export default function DepartmentsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithStats | null>(null);
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [formData, setFormData] = useState({ name: "", code: "", facultyId: "" });
  const { toast } = useToast();

  const { data: departments, isLoading } = useQuery<DepartmentWithStats[]>({
    queryKey: ["/api/departments"],
  });

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; facultyId: number }) => {
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsAddOpen(false);
      setFormData({ name: "", code: "", facultyId: "" });
      toast({ title: "Muvaffaqiyatli!", description: "Yo'nalish qo'shildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Yo'nalish qo'shishda xatolik" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; code: string; facultyId: number } }) => {
      return apiRequest("PATCH", `/api/departments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsEditOpen(false);
      setSelectedDepartment(null);
      toast({ title: "Muvaffaqiyatli!", description: "Yo'nalish yangilandi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Yo'nalish yangilashda xatolik" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsDeleteOpen(false);
      setSelectedDepartment(null);
      toast({ title: "Muvaffaqiyatli!", description: "Yo'nalish o'chirildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Yo'nalish o'chirishda xatolik" });
    },
  });

  const filteredDepartments = departments?.filter((dept) =>
    filterFaculty === "all" ? true : dept.facultyId === parseInt(filterFaculty)
  );

  const handleAdd = () => {
    setFormData({ name: "", code: "", facultyId: "" });
    setIsAddOpen(true);
  };

  const handleEdit = (department: DepartmentWithStats) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      facultyId: department.facultyId.toString(),
    });
    setIsEditOpen(true);
  };

  const handleDelete = (department: DepartmentWithStats) => {
    setSelectedDepartment(department);
    setIsDeleteOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.code || !formData.facultyId) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Barcha maydonlarni to'ldiring" });
      return;
    }
    createMutation.mutate({
      name: formData.name,
      code: formData.code,
      facultyId: parseInt(formData.facultyId),
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedDepartment || !formData.name || !formData.code || !formData.facultyId) return;
    updateMutation.mutate({
      id: selectedDepartment.id,
      data: {
        name: formData.name,
        code: formData.code,
        facultyId: parseInt(formData.facultyId),
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedDepartment) return;
    deleteMutation.mutate(selectedDepartment.id);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Yo'nalishlar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Yo'nalishlar</h2>
            <div className="flex items-center gap-4">
              <Select value={filterFaculty} onValueChange={setFilterFaculty}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-faculty">
                  <SelectValue placeholder="Fakultet tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha fakultetlar</SelectItem>
                  {faculties?.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} data-testid="button-add-department">
                <Plus className="w-4 h-4 mr-2" />
                Yo'nalish qo'shish
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredDepartments && filteredDepartments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Yo'nalish nomi</TableHead>
                      <TableHead>Fakultet</TableHead>
                      <TableHead className="text-center">Guruhlar soni</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department) => (
                      <TableRow key={department.id} data-testid={`row-department-${department.id}`}>
                        <TableCell className="font-mono font-medium">{department.code}</TableCell>
                        <TableCell>{department.name}</TableCell>
                        <TableCell>{department.facultyName}</TableCell>
                        <TableCell className="text-center">{department.groupsCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(department)}
                              data-testid={`button-edit-${department.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(department)}
                              data-testid={`button-delete-${department.id}`}
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
                  <FolderTree className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Hozircha yo'nalish yo'q
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Yo'nalish qo'shish uchun tugmani bosing
                  </p>
                  <Button onClick={handleAdd} data-testid="button-add-department-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    Yo'nalish qo'shish
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
            <DialogTitle>Yo'nalish qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="faculty">Fakultet *</Label>
              <Select value={formData.facultyId} onValueChange={(value) => setFormData({ ...formData, facultyId: value })}>
                <SelectTrigger data-testid="select-faculty">
                  <SelectValue placeholder="Fakultet tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {faculties?.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Yo'nalish nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Buxgalteriya hisobi"
                data-testid="input-department-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="BUX"
                data-testid="input-department-code"
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
            <DialogTitle>Yo'nalishni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-faculty">Fakultet *</Label>
              <Select value={formData.facultyId} onValueChange={(value) => setFormData({ ...formData, facultyId: value })}>
                <SelectTrigger data-testid="select-edit-faculty">
                  <SelectValue placeholder="Fakultet tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {faculties?.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Yo'nalish nomi *</Label>
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
            <AlertDialogTitle>Yo'nalishni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedDepartment?.name}" yo'nalishini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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
