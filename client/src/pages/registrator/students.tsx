import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Pencil, Key, Trash2, UserCircle, Copy, Check } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { User, Faculty, Department, StudentGroup } from "@shared/schema";

interface StudentWithDetails extends User {
  facultyName: string;
  departmentName: string;
  groupName: string;
  courseYear: number;
}

export default function StudentsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ userId: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterFaculty, setFilterFaculty] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    facultyId: "",
    departmentId: "",
    groupId: "",
  });
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery<StudentWithDetails[]>({
    queryKey: ["/api/students"],
  });

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: groups } = useQuery<StudentGroup[]>({
    queryKey: ["/api/groups"],
  });

  const filteredDepartments = departments?.filter(
    (dept) => !formData.facultyId || dept.facultyId === parseInt(formData.facultyId)
  );

  const filteredGroups = groups?.filter(
    (g) => !formData.departmentId || g.departmentId === parseInt(formData.departmentId)
  );

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/students", data);
    },
    onSuccess: (response: { userId: string; password: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsAddOpen(false);
      setNewCredentials(response);
      setIsCredentialsOpen(true);
      setFormData({
        fullName: "",
        email: "",
        facultyId: "",
        departmentId: "",
        groupId: "",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Talaba qo'shishda xatolik" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/students/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsEditOpen(false);
      setSelectedStudent(null);
      toast({ title: "Muvaffaqiyatli!", description: "Talaba yangilandi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Talaba yangilashda xatolik" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsDeleteOpen(false);
      setSelectedStudent(null);
      toast({ title: "Muvaffaqiyatli!", description: "Talaba o'chirildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Talaba o'chirishda xatolik" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/students/${id}/reset-password`);
    },
    onSuccess: (response: { password: string }) => {
      setIsResetPasswordOpen(false);
      if (selectedStudent) {
        setNewCredentials({ userId: selectedStudent.userId, password: response.password });
        setIsCredentialsOpen(true);
      }
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Parol yangilashda xatolik" });
    },
  });

  const filteredStudents = students?.filter((s) => {
    if (filterGroup !== "all" && s.groupId !== parseInt(filterGroup)) return false;
    if (filterDepartment !== "all" && s.departmentId !== parseInt(filterDepartment)) return false;
    if (filterFaculty !== "all" && s.facultyId !== parseInt(filterFaculty)) return false;
    return true;
  });

  const handleAdd = () => {
    setFormData({
      fullName: "",
      email: "",
      facultyId: "",
      departmentId: "",
      groupId: "",
    });
    setIsAddOpen(true);
  };

  const handleEdit = (student: StudentWithDetails) => {
    const group = groups?.find((g) => g.id === student.groupId);
    const dept = departments?.find((d) => d.id === group?.departmentId);
    setSelectedStudent(student);
    setFormData({
      fullName: student.fullName,
      email: student.email || "",
      facultyId: dept?.facultyId?.toString() || "",
      departmentId: student.departmentId?.toString() || "",
      groupId: student.groupId?.toString() || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (student: StudentWithDetails) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const handleResetPassword = (student: StudentWithDetails) => {
    setSelectedStudent(student);
    setIsResetPasswordOpen(true);
  };

  const handleCopyCredentials = () => {
    if (newCredentials) {
      navigator.clipboard.writeText(`ID: ${newCredentials.userId}\nParol: ${newCredentials.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitAdd = () => {
    if (!formData.fullName || !formData.groupId) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Barcha majburiy maydonlarni to'ldiring" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!selectedStudent || !formData.fullName) return;
    updateMutation.mutate({ id: selectedStudent.id, data: formData });
  };

  const handleConfirmDelete = () => {
    if (!selectedStudent) return;
    deleteMutation.mutate(selectedStudent.id);
  };

  const handleConfirmResetPassword = () => {
    if (!selectedStudent) return;
    resetPasswordMutation.mutate(selectedStudent.id);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="Talabalar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">Talabalar</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={filterFaculty} onValueChange={(v) => { setFilterFaculty(v); setFilterDepartment("all"); setFilterGroup("all"); }}>
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
              <Select value={filterDepartment} onValueChange={(v) => { setFilterDepartment(v); setFilterGroup("all"); }}>
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
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-group">
                  <SelectValue placeholder="Guruh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha guruhlar</SelectItem>
                  {groups?.filter((g) => filterDepartment === "all" || g.departmentId === parseInt(filterDepartment)).map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} data-testid="button-add-student">
                <Plus className="w-4 h-4 mr-2" />
                Talaba qo'shish
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
              ) : filteredStudents && filteredStudents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>F.I.O.</TableHead>
                      <TableHead>Guruh</TableHead>
                      <TableHead className="text-center">Kurs</TableHead>
                      <TableHead>Fakultet</TableHead>
                      <TableHead>Yo'nalish</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                        <TableCell className="font-mono">{student.userId}</TableCell>
                        <TableCell className="font-medium">{student.fullName}</TableCell>
                        <TableCell>{student.groupName || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{student.courseYear}-kurs</Badge>
                        </TableCell>
                        <TableCell>{student.facultyName || "-"}</TableCell>
                        <TableCell>{student.departmentName || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={student.isActive ? "default" : "secondary"}>
                            {student.isActive ? "Faol" : "Nofaol"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${student.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(student)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(student)}>
                                <Key className="w-4 h-4 mr-2" />
                                Parol yangilash
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(student)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                O'chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <UserCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Hozircha talaba yo'q
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Talaba qo'shish uchun tugmani bosing
                  </p>
                  <Button onClick={handleAdd} data-testid="button-add-student-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    Talaba qo'shish
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
            <DialogTitle>Talaba qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">F.I.O. *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Aliyev Vali Karimovich"
                data-testid="input-full-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Fakultet *</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v, departmentId: "", groupId: "" })}>
                <SelectTrigger data-testid="select-faculty">
                  <SelectValue placeholder="Tanlang" />
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
              <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v, groupId: "" })}>
                <SelectTrigger data-testid="select-department">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Guruh *</Label>
              <Select value={formData.groupId} onValueChange={(v) => setFormData({ ...formData, groupId: v })}>
                <SelectTrigger data-testid="select-group">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups?.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name} ({g.language || "O'zbek guruhi"})</SelectItem>
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

      <Dialog open={isCredentialsOpen} onOpenChange={setIsCredentialsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Talaba muvaffaqiyatli qo'shildi!</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID:</span>
                <span className="font-mono font-bold">{newCredentials?.userId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Parol:</span>
                <span className="font-mono font-bold">{newCredentials?.password}</span>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={handleCopyCredentials} data-testid="button-copy">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Nusxalandi!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Nusxalash
                </>
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCredentialsOpen(false)} data-testid="button-close">
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Talabani tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">F.I.O. *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                data-testid="input-edit-full-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Fakultet *</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v, departmentId: "", groupId: "" })}>
                <SelectTrigger data-testid="select-edit-faculty">
                  <SelectValue placeholder="Tanlang" />
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
              <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v, groupId: "" })}>
                <SelectTrigger data-testid="select-edit-department">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Guruh *</Label>
              <Select value={formData.groupId} onValueChange={(v) => setFormData({ ...formData, groupId: v })}>
                <SelectTrigger data-testid="select-edit-group">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups?.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name} ({g.language || "O'zbek guruhi"})</SelectItem>
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
            <AlertDialogTitle>Talabani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedStudent?.fullName}" talabani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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

      <AlertDialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parolni yangilash</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStudent?.userId} - {selectedStudent?.fullName} parolini yangilamoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-reset-cancel">Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmResetPassword}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset-confirm"
            >
              {resetPasswordMutation.isPending ? "Yangilanmoqda..." : "Yangilash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
