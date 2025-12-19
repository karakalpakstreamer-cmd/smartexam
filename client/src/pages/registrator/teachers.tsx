import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Eye, Pencil, Key, Trash2, GraduationCap, Copy, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Faculty, Department, Subject } from "@shared/schema";

interface TeacherWithDetails extends User {
  facultyName: string;
  departmentName: string;
  subjects: { id: number; name: string }[];
}

export default function TeachersPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithDetails | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ userId: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    facultyId: "",
    departmentId: "",
    subjectIds: [] as number[],
    autoPassword: true,
    password: "",
  });
  const { toast } = useToast();

  const { data: teachers, isLoading } = useQuery<TeacherWithDetails[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: faculties } = useQuery<Faculty[]>({
    queryKey: ["/api/faculties"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const filteredDepartments = departments?.filter(
    (dept) => !formData.facultyId || dept.facultyId === parseInt(formData.facultyId)
  );

  const filteredSubjects = subjects?.filter(
    (subj) => !formData.departmentId || subj.departmentId === parseInt(formData.departmentId)
  );

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/teachers", data);
      return res.json();
    },
    onSuccess: (response: { userId: string; password: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsAddOpen(false);
      setNewCredentials(response);
      setIsCredentialsOpen(true);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        facultyId: "",
        departmentId: "",
        subjectIds: [],
        autoPassword: true,
        password: "",
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "O'qituvchi qo'shishda xatolik" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/teachers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsEditOpen(false);
      setSelectedTeacher(null);
      toast({ title: "Muvaffaqiyatli!", description: "O'qituvchi yangilandi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "O'qituvchi yangilashda xatolik" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsDeleteOpen(false);
      setSelectedTeacher(null);
      toast({ title: "Muvaffaqiyatli!", description: "O'qituvchi o'chirildi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "O'qituvchi o'chirishda xatolik" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/teachers/${id}/reset-password`);
      return res.json();
    },
    onSuccess: (response: { password: string }) => {
      setIsResetPasswordOpen(false);
      if (selectedTeacher) {
        setNewCredentials({ userId: selectedTeacher.userId, password: response.password });
        setIsCredentialsOpen(true);
      }
    },
    onError: () => {
      toast({ variant: "destructive", title: "Xatolik!", description: "Parol yangilashda xatolik" });
    },
  });

  const handleAdd = () => {
    const year = new Date().getFullYear();
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      facultyId: "",
      departmentId: "",
      subjectIds: [],
      autoPassword: true,
      password: "",
    });
    setIsAddOpen(true);
  };

  const handleEdit = (teacher: TeacherWithDetails) => {
    const dept = departments?.find((d) => d.id === teacher.departmentId);
    setSelectedTeacher(teacher);
    setFormData({
      fullName: teacher.fullName,
      email: teacher.email || "",
      phone: teacher.phone || "",
      facultyId: dept?.facultyId?.toString() || "",
      departmentId: teacher.departmentId?.toString() || "",
      subjectIds: teacher.subjects.map((s) => s.id),
      autoPassword: true,
      password: "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (teacher: TeacherWithDetails) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  const handleResetPassword = (teacher: TeacherWithDetails) => {
    setSelectedTeacher(teacher);
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
    if (!formData.fullName || !formData.facultyId || !formData.departmentId) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Barcha majburiy maydonlarni to'ldiring" });
      return;
    }
    if (!formData.autoPassword && formData.password.length < 6) {
      toast({ variant: "destructive", title: "Xatolik!", description: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!selectedTeacher || !formData.fullName) return;
    updateMutation.mutate({ id: selectedTeacher.id, data: formData });
  };

  const handleConfirmDelete = () => {
    if (!selectedTeacher) return;
    deleteMutation.mutate(selectedTeacher.id);
  };

  const handleConfirmResetPassword = () => {
    if (!selectedTeacher) return;
    resetPasswordMutation.mutate(selectedTeacher.id);
  };

  const toggleSubject = (subjectId: number) => {
    setFormData((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[260px]">
        <Topbar title="O'qituvchilar" />
        <main className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-2xl font-semibold" data-testid="text-page-heading">O'qituvchilar</h2>
            <Button onClick={handleAdd} data-testid="button-add-teacher">
              <Plus className="w-4 h-4 mr-2" />
              O'qituvchi qo'shish
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
              ) : teachers && teachers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>F.I.O.</TableHead>
                      <TableHead>Fakultet</TableHead>
                      <TableHead>Yo'nalish</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Fanlar</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="text-right">Harakatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                        <TableCell className="font-mono">{teacher.userId}</TableCell>
                        <TableCell className="font-medium">{teacher.fullName}</TableCell>
                        <TableCell>{teacher.facultyName || "-"}</TableCell>
                        <TableCell>{teacher.departmentName || "-"}</TableCell>
                        <TableCell>{teacher.phone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.slice(0, 2).map((s) => (
                              <Badge key={s.id} variant="secondary" className="text-xs">
                                {s.name}
                              </Badge>
                            ))}
                            {teacher.subjects.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{teacher.subjects.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={teacher.isActive ? "default" : "secondary"}>
                            {teacher.isActive ? "Faol" : "Nofaol"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${teacher.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(teacher)}>
                                <Key className="w-4 h-4 mr-2" />
                                Parol yangilash
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(teacher)}
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
                  <GraduationCap className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Hozircha o'qituvchi yo'q
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    O'qituvchi qo'shish uchun tugmani bosing
                  </p>
                  <Button onClick={handleAdd} data-testid="button-add-teacher-empty">
                    <Plus className="w-4 h-4 mr-2" />
                    O'qituvchi qo'shish
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>O'qituvchi qo'shish</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">F.I.O. *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Karimov Alisher Botirovich"
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
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  data-testid="input-phone"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fakultet *</Label>
                <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v, departmentId: "", subjectIds: [] })}>
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
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v, subjectIds: [] })}>
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
                <Label>Fanlar</Label>
                <div className="border rounded-md p-3 max-h-[120px] overflow-y-auto space-y-2">
                  {filteredSubjects?.length ? (
                    filteredSubjects.map((s) => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${s.id}`}
                          checked={formData.subjectIds.includes(s.id)}
                          onCheckedChange={() => toggleSubject(s.id)}
                          data-testid={`checkbox-subject-${s.id}`}
                        />
                        <label htmlFor={`subject-${s.id}`} className="text-sm cursor-pointer">
                          {s.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Avval yo'nalishni tanlang</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoPassword"
                checked={formData.autoPassword}
                onCheckedChange={(checked) => setFormData({ ...formData, autoPassword: checked as boolean })}
                data-testid="checkbox-auto-password"
              />
              <label htmlFor="autoPassword" className="text-sm cursor-pointer">
                Avtomatik parol yaratish
              </label>
            </div>
            {!formData.autoPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Parol *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Kamida 6 ta belgi"
                  data-testid="input-password"
                />
              </div>
            )}
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
            <DialogTitle className="text-center text-green-600">O'qituvchi muvaffaqiyatli qo'shildi!</DialogTitle>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>O'qituvchini tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
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
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-edit-phone"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fakultet *</Label>
                <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v, departmentId: "", subjectIds: [] })}>
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
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v, subjectIds: [] })}>
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
                <Label>Fanlar</Label>
                <div className="border rounded-md p-3 max-h-[120px] overflow-y-auto space-y-2">
                  {filteredSubjects?.length ? (
                    filteredSubjects.map((s) => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-subject-${s.id}`}
                          checked={formData.subjectIds.includes(s.id)}
                          onCheckedChange={() => toggleSubject(s.id)}
                          data-testid={`checkbox-edit-subject-${s.id}`}
                        />
                        <label htmlFor={`edit-subject-${s.id}`} className="text-sm cursor-pointer">
                          {s.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Avval yo'nalishni tanlang</p>
                  )}
                </div>
              </div>
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
            <AlertDialogTitle>O'qituvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedTeacher?.fullName}" o'qituvchisini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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
              {selectedTeacher?.userId} - {selectedTeacher?.fullName} parolini yangilamoqchimisiz?
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
