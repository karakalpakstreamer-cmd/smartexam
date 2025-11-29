import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/login";
import SetupPage from "@/pages/setup";
import NotFound from "@/pages/not-found";

import RegistratorDashboard from "@/pages/registrator/dashboard";
import FacultiesPage from "@/pages/registrator/faculties";
import DepartmentsPage from "@/pages/registrator/departments";
import GroupsPage from "@/pages/registrator/groups";
import SubjectsPage from "@/pages/registrator/subjects";
import TeachersPage from "@/pages/registrator/teachers";
import StudentsPage from "@/pages/registrator/students";

import TeacherDashboard from "@/pages/teacher/dashboard";
import LecturesPage from "@/pages/teacher/lectures";
import ExamsPage from "@/pages/teacher/exams";
import CreateExamPage from "@/pages/teacher/create-exam";

import StudentDashboard from "@/pages/student/dashboard";
import ExamStartPage from "@/pages/student/exam-start";
import ExamSessionPage from "@/pages/student/exam-session";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: JSX.Element;
  allowedRoles: string[];
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "registrator") {
      return <Redirect to="/registrator" />;
    } else if (user.role === "oqituvchi") {
      return <Redirect to="/oqituvchi" />;
    } else {
      return <Redirect to="/talaba" />;
    }
  }

  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    if (user.role === "registrator") {
      return <Redirect to="/registrator" />;
    } else if (user.role === "oqituvchi") {
      return <Redirect to="/oqituvchi" />;
    } else {
      return <Redirect to="/talaba" />;
    }
  }

  return children;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/login" />
      </Route>

      <Route path="/login">
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      </Route>

      <Route path="/setup">
        <SetupPage />
      </Route>

      <Route path="/registrator">
        <ProtectedRoute allowedRoles={["registrator"]}>
          <RegistratorDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/registrator/fakultetlar">
        <ProtectedRoute allowedRoles={["registrator"]}>
          <FacultiesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/registrator/yonalishlar">
        <ProtectedRoute allowedRoles={["registrator"]}>
          <DepartmentsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/registrator/guruhlar">
        <ProtectedRoute allowedRoles={["registrator"]}>
          <GroupsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/registrator/fanlar">
        <ProtectedRoute allowedRoles={["registrator"]}>
          <SubjectsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/registrator/oqituvchilar">
        <ProtectedRoute allowedRoles={["registrator"]}>
          <TeachersPage />
        </ProtectedRoute>
      </Route>

      <Route path="/registrator/talabalar">
        <ProtectedRoute allowedRoles={["registrator"]}>
          <StudentsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/oqituvchi">
        <ProtectedRoute allowedRoles={["oqituvchi"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/oqituvchi/leksiyalar">
        <ProtectedRoute allowedRoles={["oqituvchi"]}>
          <LecturesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/oqituvchi/imtihonlar">
        <ProtectedRoute allowedRoles={["oqituvchi"]}>
          <ExamsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/oqituvchi/imtihonlar/yaratish">
        <ProtectedRoute allowedRoles={["oqituvchi"]}>
          <CreateExamPage />
        </ProtectedRoute>
      </Route>

      <Route path="/talaba">
        <ProtectedRoute allowedRoles={["talaba"]}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/talaba/imtihon/:examId/boshlash">
        <ProtectedRoute allowedRoles={["talaba"]}>
          <ExamStartPage />
        </ProtectedRoute>
      </Route>

      <Route path="/talaba/imtihon/:examId/session">
        <ProtectedRoute allowedRoles={["talaba"]}>
          <ExamSessionPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
