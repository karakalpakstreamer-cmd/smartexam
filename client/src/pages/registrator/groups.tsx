import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StudentGroup, Department, Faculty } from "@shared/schema";

interface GroupWithStats extends StudentGroup {
  departmentName: string;
  facultyName: string;
  studentsCount: number;
}

export default function GroupsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [formData, setFormData] = useState({ name: "", courseYear: "1", facultyId: "", departmentId: "" });
  const { toast } = useToast();

  const { data: groups, isLoading } = useQuery<GroupWithStats[]>({
    queryKey: ["/api/groups"],
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
    mutationFn: async (data: { name: string; courseYear: number; departmentId: number }) => {
      return apiRequest("POST", "/api/groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsAddOpen(false);
      setFormData({ name: "", courseYear: "1", facultyId: "", departmentId: "" });
      toast({ title: "Muvaffaqiyatli!", description: "Guruh qo'shildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Guruh qo'shishda xatolik" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; courseYear: number; departmentId: number } }) => {
      return apiRequest("PATCH", `/api/groups/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsEditOpen(false);
      setSelectedGroup(null);
      toast({ title: "Muvaffaqiyatli!", description: "Guruh yangilandi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Guruh yangilashda xatolik" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsDeleteOpen(false);
      setSelectedGroup(null);
      toast({ title: "Muvaffaqiyatli!", description: "Guruh o'chirildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Guruh o'chirishda xatolik" });
    },
  });

  const filteredGroups = groups?.filter((group) => {
    if (filterCourse !== "all" && group.courseYear !== parseInt(filterCourse)) return false;
    const dept = departments?.find((d) => d.id === group.departmentId);
    if (filterDepartment !== "all" && group.departmentId !== parseInt(filterDepartment)) return false;
    if (filterFaculty !== "all" && dept?.facultyId !== parseInt(filterFaculty)) return false;
    return true;
  });

  const handleAdd = () => {
    setFormData({ name: "", courseYear: "1", facultyId: "", departmentId: "" });
    setIsAddOpen(true);
  };

  const handleEdit = (group: GroupWithStats) => {
    const dept = departments?.find((d) => d.id === group.departmentId);
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      courseYear: group.courseYear.toString(),
      facultyId: dept?.facultyId?.toString() || "",
      departmentId: group.departmentId.toString(),
    });
    setIsEditOpen(true);
  };

  const handleDelete = (group: GroupWithStats) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.courseYear || !formData.departmentId) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Barcha maydonlarni to'ldiring" });
      return;
    }
    createMutation.mutate({
      name: formData.name,
      courseYear: parseInt(formData.courseYear),
      departmentId: parseInt(formData.departmentId),
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedGroup || !formData.name || !formData.courseYear || !formData.departmentId) return;
    updateMutation.mutate({
      id: selectedGroup.id,
      data: {
        name: formData.name,
        courseYear: parseInt(formData.courseYear),
        departmentId: parseInt(formData.departmentId),
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedGroup) return;
    deleteMutation.mutate(selectedGroup.id);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Guruhlar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Guruhlar</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={filterFaculty} onValueChange={(v) => { setFilterFaculty(v); setFilterDepartment("all"); }}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-faculty">
                  <SelectValue placeholder="Fakultet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha fakultetlar</SelectItem>
                  {faculties?.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-department">
                  <SelectValue placeholder="Yo'nalish" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha yo'nalishlar</SelectItem>
                  {departments?.filter((d) => filterFaculty === "all" || d.facultyId === parseInt(filterFaculty)).map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-[120px]" data-testid="select-filter-course">
                  <SelectValue placeholder="Kurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha kurslar</SelectItem>
                  <SelectItem value="1">1-kurs</SelectItem>
                  <SelectItem value="2">2-kurs</SelectItem>
                  <SelectItem value="3">3-kurs</SelectItem>
                  <SelectItem value="4">4-kurs</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} data-testid="button-add-group">
                <Plus className="w-4 h-4 mr-2" />
                Guruh qo'shish
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
              ) : filteredGroups && filteredGroups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guruh nomi</TableHead>
                      <TableHead>Yo'nalish</TableHead>
                      <TableHead>Fakultet</TableHead>
                      <TableHead className="text-center">Kurs</TableHead>
                      <TableHead className="text-center">Talabalar soni</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id} data-testid={`row-group-${group.id}`}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.departmentName}</TableCell>
                        <TableCell>{group.facultyName}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{group.courseYear}-kurs</Badge>
                        </TableCell>
                        <TableCell className="text-center">{group.studentsCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(group)}
                              data-testid={`button-edit-${group.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(group)}
                              data-testid={`button-delete-${group.id}`}
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
                  <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Hozircha guruh yo'q
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Guruh qo'shish uchun tugmani bosing
                  </p>
                  <Button onClick={handleAdd} data-testid="button-add-group-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    Guruh qo'shish
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
            <DialogTitle>Guruh qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fakultet *</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v, departmentId: "" })}>
                <SelectTrigger data-testid="select-add-faculty">
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
                <SelectTrigger data-testid="select-add-department">
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
              <Label htmlFor="name">Guruh nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="101-guruh"
                data-testid="input-group-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Kurs *</Label>
              <RadioGroup value={formData.courseYear} onValueChange={(v) => setFormData({ ...formData, courseYear: v })} className="flex gap-4">
                {[1, 2, 3, 4].map((year) => (
                  <div key={year} className="flex items-center space-x-2">
                    <RadioGroupItem value={year.toString()} id={`course-${year}`} data-testid={`radio-course-${year}`} />
                    <Label htmlFor={`course-${year}`} className="cursor-pointer">{year}-kurs</Label>
                  </div>
                ))}
              </RadioGroup>
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
            <DialogTitle>Guruhni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="edit-name">Guruh nomi *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Kurs *</Label>
              <RadioGroup value={formData.courseYear} onValueChange={(v) => setFormData({ ...formData, courseYear: v })} className="flex gap-4">
                {[1, 2, 3, 4].map((year) => (
                  <div key={year} className="flex items-center space-x-2">
                    <RadioGroupItem value={year.toString()} id={`edit-course-${year}`} data-testid={`radio-edit-course-${year}`} />
                    <Label htmlFor={`edit-course-${year}`} className="cursor-pointer">{year}-kurs</Label>
                  </div>
                ))}
              </RadioGroup>
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
            <AlertDialogTitle>Guruhni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedGroup?.name}" guruhini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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
