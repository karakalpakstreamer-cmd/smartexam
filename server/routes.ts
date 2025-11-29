import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";
import * as mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

declare module "express-session" {
  interface SessionData {
    userId?: number;
    role?: string;
  }
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !roles.includes(req.session.role || "")) {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }
    next();
  };
}

async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  try {
    if (fileType === "pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (fileType === "docx" || fileType === "doc") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    return "";
  } catch (error) {
    console.error("Text extraction error:", error);
    return "";
  }
}

async function generateQuestionsWithAI(content: string, subjectId: number, lectureId: number): Promise<{ text: string; keywords: string[]; sampleAnswer: string; difficulty: string }[]> {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });

    const prompt = `Sen SmartExam tizimi uchun imtihon savollarini yaratuvchi AI assistantisan.

Quyidagi leksiya matnidan 10 ta sifatli imtihon savoli yarat. Har bir savol:
- Talabaning tushunishini tekshirishi kerak
- Ochiq javobli bo'lishi kerak (test emas)
- Har xil qiyinlik darajasida bo'lishi kerak (oson, o'rta, qiyin)

LEKSIYA MATNI:
${content.substring(0, 8000)}

JAVOBNI FAQAT JSON FORMATDA BER (boshqa hech narsa yozma):
[
  {
    "text": "Savol matni",
    "keywords": ["kalit1", "kalit2", "kalit3"],
    "sampleAnswer": "Namuna javob (2-3 jumla)",
    "difficulty": "easy|medium|hard"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = "";
    try {
      if (response.response?.text) {
        const textResult = response.response.text();
        text = typeof textResult === "string" ? textResult : await textResult;
      } else if (response.candidates?.[0]?.content?.parts) {
        text = response.candidates[0].content.parts.map((p: any) => p?.text || "").join("");
      } else if (typeof response.text === "function") {
        const textResult = response.text();
        text = typeof textResult === "string" ? textResult : await textResult;
      } else if (typeof response.text === "string") {
        text = response.text;
      }
    } catch (textError) {
      console.error("Error extracting text from response:", textError);
    }
    console.log("AI question generation response:", text.substring(0, 200));
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const questions = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error("AI question generation error:", error);
    return [];
  }
}

interface GradingResult {
  score: number;
  maxScore: number;
  feedback: {
    relevance: { score: number; comment: string };
    completeness: { score: number; comment: string };
    clarity: { score: number; comment: string };
    keywords: { score: number; comment: string };
    logic: { score: number; comment: string };
  };
  overallComment: string;
}

async function gradeAnswerWithAI(
  questionText: string,
  sampleAnswer: string,
  keywords: string[],
  studentAnswer: string
): Promise<GradingResult> {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });

    const prompt = `Sen SmartExam tizimi uchun talaba javoblarini baholovchi AI assistantisan.

SAVOL:
${questionText}

NAMUNA JAVOB:
${sampleAnswer}

KALIT SO'ZLAR:
${keywords.join(", ")}

TALABA JAVOBI:
${studentAnswer || "(Javob berilmagan)"}

Talaba javobini quyidagi 5 ta mezon bo'yicha baholab, har biriga 0-3 ball ber:
1. Relevance (Tegishlilik) - Javob savolga to'g'ri javob berganmi?
2. Completeness (To'liqlik) - Javob barcha kerakli ma'lumotlarni o'z ichiga olganmi?
3. Clarity (Aniqlik) - Javob ravshan va tushunarli yozilganmi?
4. Keywords (Kalit so'zlar) - Javobda muhim kalit so'zlar ishlatilganmi?
5. Logic (Mantiqiylik) - Javob mantiqiy izchilmi?

JAVOBNI FAQAT JSON FORMATDA BER:
{
  "score": <jami ball 0-15>,
  "maxScore": 15,
  "feedback": {
    "relevance": {"score": <0-3>, "comment": "<qisqa izoh>"},
    "completeness": {"score": <0-3>, "comment": "<qisqa izoh>"},
    "clarity": {"score": <0-3>, "comment": "<qisqa izoh>"},
    "keywords": {"score": <0-3>, "comment": "<qisqa izoh>"},
    "logic": {"score": <0-3>, "comment": "<qisqa izoh>"}
  },
  "overallComment": "<umumiy baho va tavsiyalar>"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = "";
    try {
      if (response.response?.text) {
        const textResult = response.response.text();
        text = typeof textResult === "string" ? textResult : await textResult;
      } else if (response.candidates?.[0]?.content?.parts) {
        text = response.candidates[0].content.parts.map((p: any) => p?.text || "").join("");
      } else if (typeof response.text === "function") {
        const textResult = response.text();
        text = typeof textResult === "string" ? textResult : await textResult;
      } else if (typeof response.text === "string") {
        text = response.text;
      }
    } catch (textError) {
      console.error("Error extracting text from response:", textError);
    }
    console.log("AI grading response:", text.substring(0, 200));
    
    if (!text || text.trim().length === 0) {
      console.log("Empty text response from AI");
      return getDefaultGradingResult(studentAnswer);
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("No JSON match found in grading response");
      return getDefaultGradingResult(studentAnswer);
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      if (!result.feedback || result.score === undefined || result.score === null) {
        console.log("Invalid grading result structure:", result);
        return getDefaultGradingResult(studentAnswer);
      }
      const score = Number(result.score);
      if (isNaN(score) || score < 0 || score > 15) {
        console.log("Invalid score value:", result.score);
        return getDefaultGradingResult(studentAnswer);
      }
      return {
        ...result,
        score: score,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return getDefaultGradingResult(studentAnswer);
    }
  } catch (error) {
    console.error("AI grading error:", error);
    return getDefaultGradingResult(studentAnswer);
  }
}

function getDefaultGradingResult(studentAnswer: string): GradingResult {
  const hasAnswer = studentAnswer && studentAnswer.trim().length > 0;
  return {
    score: hasAnswer ? 5 : 0,
    maxScore: 15,
    feedback: {
      relevance: { score: hasAnswer ? 1 : 0, comment: hasAnswer ? "Javob berilgan" : "Javob berilmagan" },
      completeness: { score: hasAnswer ? 1 : 0, comment: hasAnswer ? "Tekshirilmadi" : "Javob berilmagan" },
      clarity: { score: hasAnswer ? 1 : 0, comment: hasAnswer ? "Tekshirilmadi" : "Javob berilmagan" },
      keywords: { score: hasAnswer ? 1 : 0, comment: hasAnswer ? "Tekshirilmadi" : "Javob berilmagan" },
      logic: { score: hasAnswer ? 1 : 0, comment: hasAnswer ? "Tekshirilmadi" : "Javob berilmagan" },
    },
    overallComment: hasAnswer ? "AI baholash vaqtincha mavjud emas" : "Talaba javob bermagan",
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "smartexam-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.get("/api/setup-check", async (req, res) => {
    try {
      const needsSetup = await storage.checkSetupNeeded();
      res.json({ needsSetup });
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/setup", async (req, res) => {
    try {
      const needsSetup = await storage.checkSetupNeeded();
      if (!needsSetup) {
        return res.status(400).json({ error: "Tizim allaqachon sozlangan" });
      }

      const { fullName, email, phone, password } = req.body;
      if (!fullName || !password) {
        return res.status(400).json({ error: "F.I.O. va parol majburiy" });
      }

      const user = await storage.setupSystem({ fullName, email, phone, password });
      res.json({ success: true, userId: user.userId });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ error: "Tizim sozlashda xatolik" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { userId, password, role } = req.body;
      if (!userId || !password || !role) {
        return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
      }

      const user = await storage.validateUserLogin(userId, password, role);
      if (!user) {
        return res.status(401).json({ error: "ID yoki parol noto'g'ri" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      await storage.createActivityLog({
        userId: user.id,
        userRole: user.role,
        action: `${user.fullName} tizimga kirdi`,
        details: { userId: user.userId },
        ipAddress: req.ip || null,
      });

      res.json({ user: { ...user, passwordHash: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Tizimga kirishda xatolik" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Chiqishda xatolik" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
      }
      res.json({ user: { ...user, passwordHash: undefined } });
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/stats", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/activity-logs", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const logs = await storage.getActivityLogs(50);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/admin/export-data", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        faculties: await storage.getFaculties(),
        departments: await storage.getDepartments(),
        groups: await storage.getGroups(),
        subjects: await storage.getSubjects(),
        teachers: await storage.getTeachers(),
        students: await storage.getStudents(),
        stats: await storage.getStats(),
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="smartexam_export_${new Date().toISOString().split("T")[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Ma'lumotlarni eksport qilishda xatolik" });
    }
  });

  app.get("/api/exams/upcoming", requireAuth, async (req, res) => {
    try {
      const exams = await storage.getUpcomingExams();
      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/faculties", requireAuth, async (req, res) => {
    try {
      const faculties = await storage.getFaculties();
      res.json(faculties);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/faculties", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { name, code } = req.body;
      if (!name || !code) {
        return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
      }
      const faculty = await storage.createFaculty({ name, code });
      res.json(faculty);
    } catch (error) {
      console.error("Create faculty error:", error);
      res.status(500).json({ error: "Fakultet yaratishda xatolik" });
    }
  });

  app.patch("/api/faculties/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code } = req.body;
      const faculty = await storage.updateFaculty(parseInt(id), { name, code });
      res.json(faculty);
    } catch (error) {
      res.status(500).json({ error: "Fakultet yangilashda xatolik" });
    }
  });

  app.delete("/api/faculties/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFaculty(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fakultet o'chirishda xatolik" });
    }
  });

  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/departments", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { name, code, facultyId } = req.body;
      if (!name || !code || !facultyId) {
        return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
      }
      const department = await storage.createDepartment({ name, code, facultyId });
      res.json(department);
    } catch (error) {
      res.status(500).json({ error: "Yo'nalish yaratishda xatolik" });
    }
  });

  app.patch("/api/departments/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, facultyId } = req.body;
      const department = await storage.updateDepartment(parseInt(id), { name, code, facultyId });
      res.json(department);
    } catch (error) {
      res.status(500).json({ error: "Yo'nalish yangilashda xatolik" });
    }
  });

  app.delete("/api/departments/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDepartment(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Yo'nalish o'chirishda xatolik" });
    }
  });

  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/groups", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { name, courseYear, departmentId } = req.body;
      if (!name || !courseYear || !departmentId) {
        return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
      }
      const group = await storage.createGroup({ name, courseYear, departmentId });
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Guruh yaratishda xatolik" });
    }
  });

  app.patch("/api/groups/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, courseYear, departmentId } = req.body;
      const group = await storage.updateGroup(parseInt(id), { name, courseYear, departmentId });
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Guruh yangilashda xatolik" });
    }
  });

  app.delete("/api/groups/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGroup(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Guruh o'chirishda xatolik" });
    }
  });

  app.get("/api/subjects", requireAuth, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/subjects", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { name, code, credits, departmentId } = req.body;
      if (!name || !code) {
        return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
      }
      const subject = await storage.createSubject({ name, code, credits: credits || 3, departmentId: departmentId || null });
      res.json(subject);
    } catch (error) {
      res.status(500).json({ error: "Fan yaratishda xatolik" });
    }
  });

  app.patch("/api/subjects/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, credits, departmentId } = req.body;
      const subject = await storage.updateSubject(parseInt(id), { name, code, credits, departmentId });
      res.json(subject);
    } catch (error) {
      res.status(500).json({ error: "Fan yangilashda xatolik" });
    }
  });

  app.delete("/api/subjects/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubject(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fan o'chirishda xatolik" });
    }
  });

  app.get("/api/teachers", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/teachers", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { fullName, email, phone, facultyId, departmentId, subjectIds, autoPassword, password } = req.body;
      if (!fullName || !facultyId || !departmentId) {
        return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
      }

      const teacherPassword = autoPassword ? undefined : password;
      const result = await storage.createTeacher({
        fullName,
        email: email || null,
        phone: phone || null,
        facultyId: parseInt(facultyId),
        departmentId: parseInt(departmentId),
        subjectIds: subjectIds || [],
        password: teacherPassword,
        userId: "",
        role: "oqituvchi",
        passwordHash: "",
      });

      res.json({ userId: result.user.userId, password: result.password });
    } catch (error) {
      console.error("Create teacher error:", error);
      res.status(500).json({ error: "O'qituvchi yaratishda xatolik" });
    }
  });

  app.patch("/api/teachers/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const teacher = await storage.updateTeacher(parseInt(id), req.body);
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ error: "O'qituvchi yangilashda xatolik" });
    }
  });

  app.delete("/api/teachers/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTeacher(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "O'qituvchi o'chirishda xatolik" });
    }
  });

  app.post("/api/teachers/:id/reset-password", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const password = await storage.resetTeacherPassword(parseInt(id));
      res.json({ password });
    } catch (error) {
      res.status(500).json({ error: "Parol yangilashda xatolik" });
    }
  });

  app.get("/api/students", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/students", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { fullName, email, groupId, autoPassword = true, password } = req.body;
      if (!fullName || !groupId) {
        return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
      }

      if (autoPassword === false && (!password || password.length < 6)) {
        return res.status(400).json({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
      }

      const result = await storage.createStudent({
        fullName,
        email: email || null,
        groupId: parseInt(groupId),
        userId: "",
        role: "talaba",
        passwordHash: "",
      }, autoPassword === false ? password : undefined);

      res.json({ userId: result.user.userId, password: result.password });
    } catch (error) {
      console.error("Create student error:", error);
      res.status(500).json({ error: "Talaba yaratishda xatolik" });
    }
  });

  app.patch("/api/students/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.updateStudent(parseInt(id), req.body);
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Talaba yangilashda xatolik" });
    }
  });

  app.delete("/api/students/:id", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStudent(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Talaba o'chirishda xatolik" });
    }
  });

  app.post("/api/students/:id/reset-password", requireAuth, requireRole("registrator"), async (req, res) => {
    try {
      const { id } = req.params;
      const password = await storage.resetStudentPassword(parseInt(id));
      res.json({ password });
    } catch (error) {
      res.status(500).json({ error: "Parol yangilashda xatolik" });
    }
  });

  app.get("/api/teacher/stats", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const stats = await storage.getTeacherStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/teacher/today-exams", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const exams = await storage.getTeacherTodayExams(req.session.userId!);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/teacher/subjects", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const subjects = await storage.getTeacherSubjects(req.session.userId!);
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/teacher/lectures", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const lectures = await storage.getTeacherLectures(req.session.userId!);
      res.json(lectures);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/lectures/upload", requireAuth, requireRole("oqituvchi"), upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const { title, subjectId } = req.body;

      if (!file || !title || !subjectId) {
        return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
      }

      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      const contentText = await extractTextFromFile(file.path, ext);

      const lecture = await storage.createLecture({
        subjectId: parseInt(subjectId),
        teacherId: req.session.userId!,
        title,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: ext,
        contentText,
        questionsGenerated: false,
        questionsCount: 0,
      });

      const questions = await generateQuestionsWithAI(contentText, parseInt(subjectId), lecture.id);

      if (questions.length > 0) {
        const questionsToInsert = questions.map((q) => ({
          lectureId: lecture.id,
          subjectId: parseInt(subjectId),
          questionText: q.text,
          difficulty: q.difficulty,
          keywords: q.keywords,
          sampleAnswer: q.sampleAnswer,
          maxPoints: "3",
        }));

        await storage.createQuestions(questionsToInsert);
        await storage.updateLectureQuestions(lecture.id, questions.length);
      }

      res.json({ success: true, lectureId: lecture.id, questionsCount: questions.length });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Leksiya yuklashda xatolik" });
    }
  });

  app.delete("/api/lectures/:id", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLecture(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Leksiya o'chirishda xatolik" });
    }
  });

  app.get("/api/student/info", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const info = await storage.getStudentInfo(req.session.userId!);
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/student/upcoming-exams", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const exams = await storage.getStudentUpcomingExams(req.session.userId!);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/teacher/questions/:subjectId", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { subjectId } = req.params;
      const questions = await storage.getTeacherQuestions(req.session.userId!, parseInt(subjectId));
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/teacher/exams", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const exams = await storage.getTeacherExams(req.session.userId!);
      res.json(exams);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/exams", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { name, subjectId, examDate, startTime, durationMinutes, questionsPerTicket, groupIds, questionIds } = req.body;
      
      if (!name || !subjectId || !examDate || !startTime || !groupIds?.length || !questionIds?.length) {
        return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
      }

      const result = await storage.createExamWithTickets({
        name,
        subjectId,
        teacherId: req.session.userId!,
        examDate,
        startTime,
        durationMinutes: durationMinutes || 60,
        questionsPerTicket: questionsPerTicket || 5,
        groupIds,
        questionIds,
      });

      res.json({ success: true, examId: result.examId, ticketCount: result.ticketCount });
    } catch (error) {
      console.error("Create exam error:", error);
      res.status(500).json({ error: "Imtihon yaratishda xatolik" });
    }
  });

  app.post("/api/exams/:id/start", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.startExam(parseInt(id), req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Imtihonni boshlashda xatolik" });
    }
  });

  app.delete("/api/exams/:id", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExam(parseInt(id), req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Imtihonni o'chirishda xatolik" });
    }
  });

  app.get("/api/student/exam/:examId", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const { examId } = req.params;
      const exam = await storage.getStudentExamDetails(req.session.userId!, parseInt(examId));
      if (!exam) {
        return res.status(404).json({ error: "Imtihon topilmadi" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/student/exam/:examId/start", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const { examId } = req.params;
      const session = await storage.startStudentExamSession(req.session.userId!, parseInt(examId));
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Imtihonni boshlashda xatolik" });
    }
  });

  app.get("/api/student/exam-session/:examId", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const { examId } = req.params;
      const session = await storage.getStudentExamSession(req.session.userId!, parseInt(examId));
      if (!session) {
        return res.status(404).json({ error: "Sessiya topilmadi" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/student/exam-session/:sessionId/answer", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, answerText } = req.body;
      await storage.saveStudentAnswer(parseInt(sessionId), questionId, answerText);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Javobni saqlashda xatolik" });
    }
  });

  app.post("/api/student/exam-session/:sessionId/violation", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { type } = req.body;
      await storage.recordViolation(parseInt(sessionId), type);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.post("/api/student/exam-session/:sessionId/submit", requireAuth, requireRole("talaba"), async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.submitExamSession(parseInt(sessionId));
      
      const answers = await storage.getSessionAnswersForGrading(parseInt(sessionId));
      
      for (const answer of answers) {
        try {
          const gradingResult = await gradeAnswerWithAI(
            answer.questionText,
            answer.sampleAnswer || "",
            answer.keywords || [],
            answer.answerText || ""
          );
          
          await storage.updateAnswerGrade(
            answer.answerId,
            gradingResult.score.toString(),
            gradingResult
          );
        } catch (gradingError) {
          console.error("Grading error for answer:", answer.answerId, gradingError);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Imtihonni topshirishda xatolik" });
    }
  });

  app.get("/api/teacher/results", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const examId = req.query.examId ? parseInt(req.query.examId as string) : undefined;
      const results = await storage.getTeacherExamResults(req.session.userId!, examId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.get("/api/teacher/results/:sessionId", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await storage.getSessionDetails(parseInt(sessionId), req.session.userId!);
      if (!result) {
        return res.status(404).json({ error: "Natija topilmadi" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
    }
  });

  app.patch("/api/teacher/answers/:answerId/score", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { answerId } = req.params;
      const { score, comment } = req.body;
      await storage.updateAnswerManualScore(parseInt(answerId), score, comment);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ballni yangilashda xatolik" });
    }
  });

  app.get("/api/teacher/export/:examId", requireAuth, requireRole("oqituvchi"), async (req, res) => {
    try {
      const { examId } = req.params;
      const data = await storage.getExamExportData(parseInt(examId), req.session.userId!);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Ma'lumotlarni eksport qilishda xatolik" });
    }
  });

  return httpServer;
}
