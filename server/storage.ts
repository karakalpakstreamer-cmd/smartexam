import { db } from "./db";
import { eq, sql, and, desc, gte, lte, inArray, count } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import {
  users,
  faculties,
  departments,
  studentGroups,
  subjects,
  teacherSubjects,
  lectures,
  questions,
  exams,
  examTickets,
  examSessions,
  studentAnswers,
  activityLogs,
  type User,
  type InsertUser,
  type Faculty,
  type InsertFaculty,
  type Department,
  type InsertDepartment,
  type StudentGroup,
  type InsertStudentGroup,
  type Subject,
  type InsertSubject,
  type TeacherSubject,
  type Lecture,
  type InsertLecture,
  type Question,
  type InsertQuestion,
  type Exam,
  type InsertExam,
  type ExamTicket,
  type InsertExamTicket,
  type ExamSession,
  type InsertExamSession,
  type StudentAnswer,
  type InsertStudentAnswer,
  type ActivityLog,
  type InsertActivityLog,
} from "../shared/schema";

export interface IStorage {
  checkSetupNeeded(): Promise<boolean>;
  setupSystem(data: { fullName: string; email: string | null; phone: string | null; password: string; userId?: string }): Promise<User>;

  getUserById(id: number): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  validateUserLogin(userId: string, password: string, role: string): Promise<User | null>;
  getNextUserId(prefix: string): Promise<string>;

  createFaculty(data: InsertFaculty): Promise<Faculty>;
  getFaculties(): Promise<(Faculty & { departmentsCount: number; teachersCount: number; studentsCount: number })[]>;
  updateFaculty(id: number, data: Partial<InsertFaculty>): Promise<Faculty>;
  deleteFaculty(id: number): Promise<void>;

  createDepartment(data: InsertDepartment): Promise<Department>;
  getDepartments(): Promise<(Department & { facultyName: string; groupsCount: number })[]>;
  updateDepartment(id: number, data: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: number): Promise<void>;

  createGroup(data: InsertStudentGroup): Promise<StudentGroup>;
  getGroups(): Promise<(StudentGroup & { departmentName: string; facultyName: string; studentsCount: number })[]>;
  updateGroup(id: number, data: Partial<InsertStudentGroup>): Promise<StudentGroup>;
  deleteGroup(id: number): Promise<void>;

  createSubject(data: InsertSubject): Promise<Subject>;
  getSubjects(): Promise<(Subject & { departmentName: string; facultyName: string; teachersCount: number })[]>;
  getSubjectsByDepartment(departmentId: number): Promise<Subject[]>;
  updateSubject(id: number, data: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: number): Promise<void>;

  createTeacher(data: InsertUser & { subjectIds?: number[]; password?: string }): Promise<{ user: User; password: string }>;
  getTeachers(): Promise<(User & { facultyName: string; departmentName: string; subjects: { id: number; name: string }[] })[]>;
  updateTeacher(id: number, data: Partial<InsertUser> & { subjectIds?: number[] }): Promise<User>;
  deleteTeacher(id: number): Promise<void>;
  resetTeacherPassword(id: number): Promise<string>;

  createStudent(data: InsertUser, customPassword?: string): Promise<{ user: User; password: string }>;
  getStudents(): Promise<(User & { facultyName: string; departmentName: string; groupName: string; courseYear: number })[]>;
  updateStudent(id: number, data: Partial<InsertUser>): Promise<User>;
  deleteStudent(id: number): Promise<void>;
  resetStudentPassword(id: number): Promise<string>;

  getStats(): Promise<{ faculties: number; teachers: number; students: number; activeExams: number }>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;

  getTeacherSubjects(teacherId: number): Promise<Subject[]>;
  getTeacherLectures(teacherId: number): Promise<(Lecture & { subjectName: string })[]>;
  createLecture(data: InsertLecture): Promise<Lecture>;
  deleteLecture(id: number): Promise<void>;
  updateLectureQuestions(lectureId: number, count: number): Promise<void>;

  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  getUpcomingExams(): Promise<Exam[]>;

  getStudentInfo(studentId: number): Promise<{ groupName: string; courseYear: number; facultyName: string; departmentName: string }>;
  getStudentUpcomingExams(studentId: number): Promise<any[]>;
  getStudentExams(studentId: number): Promise<any[]>;
  getStudentExamResult(studentId: number, examId: number): Promise<any>;

  getTeacherStats(teacherId: number): Promise<{ subjectsCount: number; lecturesCount: number; todayExamsCount: number }>;
  getTeacherTodayExams(teacherId: number): Promise<any[]>;
  getTeacherQuestions(teacherId: number, subjectId: number): Promise<any[]>;
  getTeacherExams(teacherId: number): Promise<any[]>;
  createExamWithTickets(data: any): Promise<{ examId: number; ticketCount: number }>;
  startExam(examId: number, teacherId: number): Promise<void>;
  deleteExam(examId: number, teacherId: number): Promise<void>;
  getStudentExamDetails(studentId: number, examId: number): Promise<any>;
  startStudentExamSession(studentId: number, examId: number): Promise<any>;
  getStudentExamSession(studentId: number, examId: number): Promise<any>;
  saveStudentAnswer(sessionId: number, questionId: number, answerText: string): Promise<void>;
  recordViolation(sessionId: number, type: string): Promise<void>;
  submitExamSession(sessionId: number): Promise<void>;
  getSessionAnswersForGrading(sessionId: number): Promise<any[]>;
  updateAnswerGrade(answerId: number, score: string, feedback: object): Promise<void>;
  getTeacherExamResults(teacherId: number, examIdFilter?: number): Promise<any[]>;
  getSessionDetails(sessionId: number, teacherId: number): Promise<any | null>;
  updateAnswerManualScore(answerId: number, score: number, comment: string): Promise<void>;
  getExamExportData(examId: number, teacherId: number): Promise<any>;
  getExamMonitoringData(examId: number, teacherId: number): Promise<any>;
  endExam(examId: number, teacherId: number): Promise<void>;
  addExamTime(examId: number, teacherId: number, minutes: number): Promise<void>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean>;
}

function generatePassword(userId: string): string {
  return "password" + userId.toLowerCase();
}

export const storage: IStorage = {
  async checkSetupNeeded(): Promise<boolean> {
    const registrators = await db.select().from(users).where(eq(users.role, "registrator")).limit(1);
    return registrators.length === 0;
  },

  async setupSystem(data): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const [user] = await db.insert(users).values({
      userId: data.userId || "R001",
      role: "registrator",
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      isActive: true,
    }).returning();
    return user;
  },

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  },

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
    return user;
  },

  async validateUserLogin(userId: string, password: string, role: string): Promise<User | null> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.userId, userId), eq(users.role, role), eq(users.isActive, true)))
      .limit(1);

    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
    return user;
  },

  async getNextUserId(prefix: string): Promise<string> {
    const [result] = await db.select({ maxId: sql<string>`MAX(${users.userId})` })
      .from(users)
      .where(sql`${users.userId} LIKE ${prefix + '%'}`);

    if (!result.maxId) {
      return `${prefix}001`;
    }

    const numPart = parseInt(result.maxId.replace(prefix, ""), 10);
    return `${prefix}${String(numPart + 1).padStart(3, "0")}`;
  },

  async createFaculty(data: InsertFaculty): Promise<Faculty> {
    const [faculty] = await db.insert(faculties).values(data).returning();
    return faculty;
  },

  async getFaculties(): Promise<(Faculty & { departmentsCount: number; teachersCount: number; studentsCount: number })[]> {
    const allFaculties = await db.select().from(faculties).orderBy(faculties.name);

    const result = await Promise.all(allFaculties.map(async (f) => {
      const depts = await db.select({ count: count() }).from(departments).where(eq(departments.facultyId, f.id));
      const teachers = await db.select({ count: count() }).from(users).where(and(eq(users.facultyId, f.id), eq(users.role, "oqituvchi")));
      const students = await db.select({ count: count() }).from(users).where(and(eq(users.facultyId, f.id), eq(users.role, "talaba")));

      return {
        ...f,
        departmentsCount: Number(depts[0]?.count) || 0,
        teachersCount: Number(teachers[0]?.count) || 0,
        studentsCount: Number(students[0]?.count) || 0,
      };
    }));

    return result;
  },

  async updateFaculty(id: number, data: Partial<InsertFaculty>): Promise<Faculty> {
    const [faculty] = await db.update(faculties).set(data).where(eq(faculties.id, id)).returning();
    return faculty;
  },

  async deleteFaculty(id: number): Promise<void> {
    await db.delete(faculties).where(eq(faculties.id, id));
  },

  async createDepartment(data: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(data).returning();
    return department;
  },

  async getDepartments(): Promise<(Department & { facultyName: string; groupsCount: number })[]> {
    const allDepartments = await db.select().from(departments).orderBy(departments.name);

    const result = await Promise.all(allDepartments.map(async (d) => {
      const [faculty] = await db.select().from(faculties).where(eq(faculties.id, d.facultyId)).limit(1);
      const groups = await db.select({ count: count() }).from(studentGroups).where(eq(studentGroups.departmentId, d.id));

      return {
        ...d,
        facultyName: faculty?.name || "",
        groupsCount: Number(groups[0]?.count) || 0,
      };
    }));

    return result;
  },

  async updateDepartment(id: number, data: Partial<InsertDepartment>): Promise<Department> {
    const [department] = await db.update(departments).set(data).where(eq(departments.id, id)).returning();
    return department;
  },

  async deleteDepartment(id: number): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  },

  async createGroup(data: InsertStudentGroup): Promise<StudentGroup> {
    const [group] = await db.insert(studentGroups).values(data).returning();
    return group;
  },

  async getGroups(): Promise<(StudentGroup & { departmentName: string; facultyName: string; studentsCount: number })[]> {
    const allGroups = await db.select().from(studentGroups).orderBy(studentGroups.name);

    const result = await Promise.all(allGroups.map(async (g) => {
      const [dept] = await db.select().from(departments).where(eq(departments.id, g.departmentId)).limit(1);
      const [faculty] = dept ? await db.select().from(faculties).where(eq(faculties.id, dept.facultyId)).limit(1) : [null];
      const students = await db.select({ count: count() }).from(users).where(and(eq(users.groupId, g.id), eq(users.role, "talaba")));

      return {
        ...g,
        departmentName: dept?.name || "",
        facultyName: faculty?.name || "",
        studentsCount: Number(students[0]?.count) || 0,
      };
    }));

    return result;
  },

  async updateGroup(id: number, data: Partial<InsertStudentGroup>): Promise<StudentGroup> {
    const [group] = await db.update(studentGroups).set(data).where(eq(studentGroups.id, id)).returning();
    return group;
  },

  async deleteGroup(id: number): Promise<void> {
    await db.delete(studentGroups).where(eq(studentGroups.id, id));
  },

  async createSubject(data: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(data).returning();
    return subject;
  },

  async getSubjects(): Promise<(Subject & { departmentName: string; facultyName: string; teachersCount: number })[]> {
    const allSubjects = await db.select().from(subjects).orderBy(subjects.name);

    const result = await Promise.all(allSubjects.map(async (s) => {
      const [dept] = s.departmentId ? await db.select().from(departments).where(eq(departments.id, s.departmentId)).limit(1) : [null];
      const [faculty] = dept ? await db.select().from(faculties).where(eq(faculties.id, dept.facultyId)).limit(1) : [null];
      const teachers = await db.select({ count: count() }).from(teacherSubjects).where(eq(teacherSubjects.subjectId, s.id));

      return {
        ...s,
        departmentName: dept?.name || "",
        facultyName: faculty?.name || "",
        teachersCount: Number(teachers[0]?.count) || 0,
      };
    }));

    return result;
  },

  async getSubjectsByDepartment(departmentId: number): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.departmentId, departmentId)).orderBy(subjects.name);
  },

  async updateSubject(id: number, data: Partial<InsertSubject>): Promise<Subject> {
    const [subject] = await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
    return subject;
  },

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  },

  async createTeacher(data): Promise<{ user: User; password: string }> {
    const userId = await this.getNextUserId("T");
    const password = data.password || generatePassword(userId);
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users).values({
      userId,
      role: "oqituvchi",
      fullName: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      facultyId: data.facultyId ? parseInt(String(data.facultyId)) : null,
      departmentId: data.departmentId ? parseInt(String(data.departmentId)) : null,
      passwordHash,
      isActive: true,
    }).returning();

    if (data.subjectIds && data.subjectIds.length > 0) {
      await db.insert(teacherSubjects).values(
        data.subjectIds.map((subjectId: number) => ({
          teacherId: user.id,
          subjectId,
        }))
      );
    }

    return { user, password };
  },

  async getTeachers(): Promise<(User & { facultyName: string; departmentName: string; subjects: { id: number; name: string }[] })[]> {
    const allTeachers = await db.select().from(users).where(eq(users.role, "oqituvchi")).orderBy(users.fullName);

    const result = await Promise.all(allTeachers.map(async (t) => {
      const [faculty] = t.facultyId ? await db.select().from(faculties).where(eq(faculties.id, t.facultyId)).limit(1) : [null];
      const [dept] = t.departmentId ? await db.select().from(departments).where(eq(departments.id, t.departmentId)).limit(1) : [null];
      const teacherSubjectsList = await db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, t.id));

      const subjectDetails = await Promise.all(
        teacherSubjectsList.map(async (ts) => {
          const [subject] = await db.select().from(subjects).where(eq(subjects.id, ts.subjectId)).limit(1);
          return subject ? { id: subject.id, name: subject.name } : null;
        })
      );

      return {
        ...t,
        facultyName: faculty?.name || "",
        departmentName: dept?.name || "",
        subjects: subjectDetails.filter(Boolean) as { id: number; name: string }[],
      };
    }));

    return result;
  },

  async updateTeacher(id: number, data): Promise<User> {
    const updateData: Partial<InsertUser> = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.facultyId) updateData.facultyId = parseInt(String(data.facultyId));
    if (data.departmentId) updateData.departmentId = parseInt(String(data.departmentId));

    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();

    if (data.subjectIds !== undefined) {
      await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, id));
      if (data.subjectIds.length > 0) {
        await db.insert(teacherSubjects).values(
          data.subjectIds.map((subjectId: number) => ({
            teacherId: id,
            subjectId,
          }))
        );
      }
    }

    return user;
  },

  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, id));
    await db.delete(users).where(eq(users.id, id));
  },

  async resetTeacherPassword(id: number): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new Error("User not found");
    const password = generatePassword(user.userId);
    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
    return password;
  },

  async createStudent(data, customPassword?: string): Promise<{ user: User; password: string }> {
    const userId = await this.getNextUserId("S");
    const password = customPassword || generatePassword(userId);
    const passwordHash = await bcrypt.hash(password, 10);

    const group = data.groupId ? await db.select().from(studentGroups).where(eq(studentGroups.id, parseInt(String(data.groupId)))).limit(1) : [];
    const dept = group[0] ? await db.select().from(departments).where(eq(departments.id, group[0].departmentId)).limit(1) : [];

    const [user] = await db.insert(users).values({
      userId,
      role: "talaba",
      fullName: data.fullName,
      email: data.email || null,
      facultyId: dept[0]?.facultyId || null,
      departmentId: group[0]?.departmentId || null,
      groupId: data.groupId ? parseInt(String(data.groupId)) : null,
      passwordHash,
      isActive: true,
    }).returning();

    return { user, password };
  },

  async getStudents(): Promise<(User & { facultyName: string; departmentName: string; groupName: string; courseYear: number })[]> {
    const allStudents = await db.select().from(users).where(eq(users.role, "talaba")).orderBy(users.fullName);

    const result = await Promise.all(allStudents.map(async (s) => {
      const [group] = s.groupId ? await db.select().from(studentGroups).where(eq(studentGroups.id, s.groupId)).limit(1) : [null];
      const [dept] = s.departmentId ? await db.select().from(departments).where(eq(departments.id, s.departmentId)).limit(1) : [null];
      const [faculty] = s.facultyId ? await db.select().from(faculties).where(eq(faculties.id, s.facultyId)).limit(1) : [null];

      return {
        ...s,
        facultyName: faculty?.name || "",
        departmentName: dept?.name || "",
        groupName: group?.name || "",
        courseYear: group?.courseYear || 1,
      };
    }));

    return result;
  },

  async updateStudent(id: number, data): Promise<User> {
    const updateData: Partial<InsertUser> = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email || null;

    if (data.groupId) {
      const groupId = parseInt(String(data.groupId));
      updateData.groupId = groupId;

      const [group] = await db.select().from(studentGroups).where(eq(studentGroups.id, groupId)).limit(1);
      if (group) {
        updateData.departmentId = group.departmentId;
        const [dept] = await db.select().from(departments).where(eq(departments.id, group.departmentId)).limit(1);
        if (dept) {
          updateData.facultyId = dept.facultyId;
        }
      }
    }

    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  },

  async deleteStudent(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  },

  async resetStudentPassword(id: number): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new Error("User not found");
    const password = generatePassword(user.userId);
    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
    return password;
  },

  async getStats(): Promise<{ faculties: number; teachers: number; students: number; activeExams: number }> {
    const [facultiesCount] = await db.select({ count: count() }).from(faculties);
    const [teachersCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "oqituvchi"));
    const [studentsCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "talaba"));
    const [activeExamsCount] = await db.select({ count: count() }).from(exams).where(eq(exams.status, "active"));

    return {
      faculties: Number(facultiesCount?.count) || 0,
      teachers: Number(teachersCount?.count) || 0,
      students: Number(studentsCount?.count) || 0,
      activeExams: Number(activeExamsCount?.count) || 0,
    };
  },

  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  },

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(data).returning();
    return log;
  },

  async getTeacherSubjects(teacherId: number): Promise<Subject[]> {
    const assignments = await db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
    if (assignments.length === 0) return [];

    const subjectIds = assignments.map((a) => a.subjectId);
    return db.select().from(subjects).where(inArray(subjects.id, subjectIds)).orderBy(subjects.name);
  },

  async getTeacherLectures(teacherId: number): Promise<(Lecture & { subjectName: string })[]> {
    const allLectures = await db.select().from(lectures).where(eq(lectures.teacherId, teacherId)).orderBy(desc(lectures.uploadedAt));

    const result = await Promise.all(allLectures.map(async (l) => {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, l.subjectId)).limit(1);
      return {
        ...l,
        subjectName: subject?.name || "",
      };
    }));

    return result;
  },

  async createLecture(data: InsertLecture): Promise<Lecture> {
    const [lecture] = await db.insert(lectures).values(data).returning();
    return lecture;
  },

  async deleteLecture(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.lectureId, id));
    await db.delete(lectures).where(eq(lectures.id, id));
  },

  async updateLectureQuestions(lectureId: number, count: number): Promise<void> {
    await db.update(lectures).set({
      questionsGenerated: true,
      questionsCount: count,
    }).where(eq(lectures.id, lectureId));
  },

  async createQuestions(questionsData: InsertQuestion[]): Promise<Question[]> {
    if (questionsData.length === 0) return [];
    const inserted = await db.insert(questions).values(questionsData).returning();
    return inserted;
  },

  async getUpcomingExams(): Promise<Exam[]> {
    const today = new Date().toISOString().split("T")[0];
    return db.select().from(exams)
      .where(gte(exams.examDate, today))
      .orderBy(exams.examDate, exams.startTime)
      .limit(10);
  },

  async getStudentInfo(studentId: number): Promise<{ groupName: string; courseYear: number; facultyName: string; departmentName: string }> {
    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student) return { groupName: "", courseYear: 1, facultyName: "", departmentName: "" };

    const [group] = student.groupId ? await db.select().from(studentGroups).where(eq(studentGroups.id, student.groupId)).limit(1) : [null];
    const [dept] = student.departmentId ? await db.select().from(departments).where(eq(departments.id, student.departmentId)).limit(1) : [null];
    const [faculty] = student.facultyId ? await db.select().from(faculties).where(eq(faculties.id, student.facultyId)).limit(1) : [null];

    return {
      groupName: group?.name || "",
      courseYear: group?.courseYear || 1,
      facultyName: faculty?.name || "",
      departmentName: dept?.name || "",
    };
  },

  async getStudentUpcomingExams(studentId: number): Promise<any[]> {
    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student?.groupId) return [];

    const today = new Date().toISOString().split("T")[0];
    const allExams = await db.select().from(exams)
      .where(and(gte(exams.examDate, today), eq(exams.status, "scheduled")))
      .orderBy(exams.examDate, exams.startTime);

    const relevantExams = allExams.filter((e) => e.targetGroups?.includes(student.groupId!));

    const result = await Promise.all(relevantExams.map(async (exam) => {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, exam.subjectId!)).limit(1);
      const [teacher] = await db.select().from(users).where(eq(users.id, exam.teacherId!)).limit(1);

      return {
        id: exam.id,
        name: exam.name,
        subjectName: subject?.name || "",
        teacherName: teacher?.fullName || "",
        examDate: exam.examDate,
        startTime: exam.startTime,
        durationMinutes: exam.durationMinutes,
        status: exam.status,
      };
    }));

    return result;
  },

  async getStudentExams(studentId: number): Promise<any[]> {
    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student?.groupId) return [];

    const allExams = await db.select().from(exams).orderBy(desc(exams.examDate), desc(exams.startTime));
    const relevantExams = allExams.filter((e) => e.targetGroups?.includes(student.groupId!));

    const result = await Promise.all(relevantExams.map(async (exam) => {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, exam.subjectId!)).limit(1);
      const [teacher] = await db.select().from(users).where(eq(users.id, exam.teacherId!)).limit(1);

      const [session] = await db.select().from(examSessions)
        .where(and(eq(examSessions.examId, exam.id), eq(examSessions.studentId, studentId)))
        .limit(1);

      let totalScore = 0;
      if (session) {
        const answers = await db.select().from(studentAnswers).where(eq(studentAnswers.sessionId, session.id));
        totalScore = answers.reduce((sum, a) => sum + (parseFloat(a.aiScore || "0") || 0), 0);
      }

      return {
        id: exam.id,
        name: exam.name,
        subjectName: subject?.name || "",
        teacherName: teacher?.fullName || "",
        examDate: exam.examDate,
        startTime: exam.startTime,
        durationMinutes: exam.durationMinutes,
        questionsPerTicket: exam.questionsPerTicket || 5,
        status: exam.status,
        hasSession: !!session,
        sessionStatus: session?.status,
        score: Math.round(totalScore * 10) / 10,
      };
    }));

    return result;
  },

  async getStudentExamResult(studentId: number, examId: number): Promise<any> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
    if (!exam) throw new Error("Imtihon topilmadi");

    const [subject] = await db.select().from(subjects).where(eq(subjects.id, exam.subjectId!)).limit(1);

    const [session] = await db.select().from(examSessions)
      .where(and(eq(examSessions.examId, examId), eq(examSessions.studentId, studentId)))
      .limit(1);

    let answeredCount = 0;
    let totalQuestions = exam.questionsPerTicket || 5;

    if (session) {
      const answers = await db.select().from(studentAnswers).where(eq(studentAnswers.sessionId, session.id));
      answeredCount = answers.filter(a => a.answerText && a.answerText.trim().length > 0).length;
    }

    return {
      examName: exam.name,
      subjectName: subject?.name || "",
      submittedAt: session?.submittedAt,
      answeredCount,
      totalQuestions,
      status: session?.status || "unknown",
    };
  },

  async getTeacherStats(teacherId: number): Promise<{ subjectsCount: number; lecturesCount: number; todayExamsCount: number }> {
    const subjectsAssigned = await db.select({ count: count() }).from(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
    const lecturesUploaded = await db.select({ count: count() }).from(lectures).where(eq(lectures.teacherId, teacherId));

    const today = new Date().toISOString().split("T")[0];
    const todayExams = await db.select({ count: count() }).from(exams)
      .where(and(eq(exams.teacherId, teacherId), eq(exams.examDate, today)));

    return {
      subjectsCount: Number(subjectsAssigned[0]?.count) || 0,
      lecturesCount: Number(lecturesUploaded[0]?.count) || 0,
      todayExamsCount: Number(todayExams[0]?.count) || 0,
    };
  },

  async getTeacherTodayExams(teacherId: number): Promise<any[]> {
    const today = new Date().toISOString().split("T")[0];
    const todayExams = await db.select().from(exams)
      .where(and(eq(exams.teacherId, teacherId), eq(exams.examDate, today)))
      .orderBy(exams.startTime);

    const result = await Promise.all(todayExams.map(async (exam) => {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, exam.subjectId!)).limit(1);

      const groupNames = await Promise.all((exam.targetGroups || []).map(async (gId) => {
        const [group] = await db.select().from(studentGroups).where(eq(studentGroups.id, gId)).limit(1);
        return group?.name || "";
      }));

      return {
        id: exam.id,
        name: exam.name,
        subjectName: subject?.name || "",
        startTime: exam.startTime,
        groups: groupNames.filter(Boolean),
        status: exam.status,
      };
    }));

    return result;
  },

  async getTeacherQuestions(teacherId: number, subjectId: number): Promise<any[]> {
    const teacherLectures = await db.select().from(lectures)
      .where(and(eq(lectures.teacherId, teacherId), eq(lectures.subjectId, subjectId)));

    const lectureIds = teacherLectures.map((l) => l.id);
    if (lectureIds.length === 0) return [];

    const allQuestions = await db.select().from(questions)
      .where(inArray(questions.lectureId, lectureIds));

    return allQuestions.map((q) => {
      const lecture = teacherLectures.find((l) => l.id === q.lectureId);
      return {
        ...q,
        lectureTitle: lecture?.title || "",
      };
    });
  },

  async getTeacherExams(teacherId: number): Promise<any[]> {
    const allExams = await db.select().from(exams)
      .where(eq(exams.teacherId, teacherId))
      .orderBy(desc(exams.examDate));

    const result = await Promise.all(allExams.map(async (exam) => {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, exam.subjectId!)).limit(1);

      const ticketCount = await db.select({ count: count() }).from(examTickets)
        .where(eq(examTickets.examId, exam.id));

      const groupNames = await Promise.all((exam.targetGroups || []).map(async (gId) => {
        const [group] = await db.select().from(studentGroups).where(eq(studentGroups.id, gId)).limit(1);
        return group?.name || "";
      }));

      return {
        id: exam.id,
        name: exam.name,
        subjectName: subject?.name || "",
        examDate: exam.examDate,
        startTime: exam.startTime,
        durationMinutes: exam.durationMinutes,
        status: exam.status,
        groupNames: groupNames.filter(Boolean),
        ticketCount: Number(ticketCount[0]?.count) || 0,
        questionsPerTicket: exam.questionsPerTicket,
      };
    }));

    return result;
  },

  async createExamWithTickets(data: {
    name: string;
    subjectId: number;
    teacherId: number;
    examDate: string;
    startTime: string;
    durationMinutes: number;
    questionsPerTicket: number;
    groupIds: number[];
    questionIds: number[];
    examType?: string;
  }): Promise<{ examId: number; ticketCount: number }> {
    const [exam] = await db.insert(exams).values({
      name: data.name,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      examDate: data.examDate,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      questionsPerTicket: data.questionsPerTicket,
      targetGroups: data.groupIds,
      examType: data.examType || "yozma",
      status: "scheduled",
    }).returning();

    const studentsInGroups = await db.select().from(users)
      .where(and(eq(users.role, "talaba"), inArray(users.groupId!, data.groupIds)));

    const questionPool = [...data.questionIds];
    const usedCombinations = new Set<string>();

    for (const student of studentsInGroups) {
      let ticketQuestions: number[] = [];
      let attempts = 0;
      const maxAttempts = 100;

      while (attempts < maxAttempts) {
        const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
        ticketQuestions = shuffled.slice(0, data.questionsPerTicket);
        const combinationKey = ticketQuestions.sort((a, b) => a - b).join(",");

        if (!usedCombinations.has(combinationKey) || attempts === maxAttempts - 1) {
          usedCombinations.add(combinationKey);
          break;
        }
        attempts++;
      }

      await db.insert(examTickets).values({
        examId: exam.id,
        assignedTo: student.id,
        questionIds: ticketQuestions,
        ticketNumber: studentsInGroups.indexOf(student) + 1,
      });
    }

    return { examId: exam.id, ticketCount: studentsInGroups.length };
  },

  async startExam(examId: number, teacherId: number): Promise<void> {
    await db.update(exams)
      .set({ status: "active" })
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));
  },

  async deleteExam(examId: number, teacherId: number): Promise<void> {
    const [exam] = await db.select().from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam || exam.status !== "scheduled") {
      throw new Error("Imtihonni o'chirib bo'lmaydi");
    }

    await db.delete(examTickets).where(eq(examTickets.examId, examId));
    await db.delete(exams).where(eq(exams.id, examId));
  },

  async getStudentExamDetails(studentId: number, examId: number): Promise<any> {
    const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (!student?.groupId) return null;

    const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
    if (!exam || !exam.targetGroups?.includes(student.groupId)) return null;

    const [subject] = await db.select().from(subjects).where(eq(subjects.id, exam.subjectId!)).limit(1);
    const [teacher] = await db.select().from(users).where(eq(users.id, exam.teacherId!)).limit(1);
    const [group] = await db.select().from(studentGroups).where(eq(studentGroups.id, student.groupId)).limit(1);
    const [faculty] = student.facultyId ? await db.select().from(faculties).where(eq(faculties.id, student.facultyId)).limit(1) : [null];

    const now = new Date();
    const examDateTime = new Date(`${exam.examDate}T${exam.startTime}`);
    const canStart = exam.status === "active" || (now >= examDateTime && exam.status === "scheduled");

    return {
      id: exam.id,
      name: exam.name,
      subjectName: subject?.name || "",
      teacherName: teacher?.fullName || "",
      examDate: exam.examDate,
      startTime: exam.startTime,
      durationMinutes: exam.durationMinutes,
      questionsCount: exam.questionsPerTicket,
      status: exam.status,
      canStart,
      studentInfo: {
        fullName: student.fullName,
        userId: student.userId,
        groupName: group?.name || "",
        facultyName: faculty?.name || "",
      },
    };
  },

  async startStudentExamSession(studentId: number, examId: number): Promise<any> {
    const [ticket] = await db.select().from(examTickets)
      .where(and(eq(examTickets.examId, examId), eq(examTickets.assignedTo, studentId)))
      .limit(1);

    if (!ticket) {
      throw new Error("Sizga bilet ajratilmagan");
    }

    const existingSession = await db.select().from(examSessions)
      .where(and(eq(examSessions.ticketId, ticket.id), eq(examSessions.studentId, studentId)))
      .limit(1);

    if (existingSession.length > 0 && existingSession[0].status === "submitted") {
      throw new Error("Siz bu imtihonni allaqachon topshirgansiz");
    }

    if (existingSession.length > 0) {
      return { sessionId: existingSession[0].id };
    }

    const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
    if (!exam) throw new Error("Imtihon topilmadi");

    const startedAt = new Date();

    const [session] = await db.insert(examSessions).values({
      examId,
      ticketId: ticket.id,
      studentId,
      startedAt,
      status: "active",
      violationsCount: 0,
    }).returning();

    return { sessionId: session.id };
  },

  async getStudentExamSession(studentId: number, examId: number): Promise<any> {
    const [ticket] = await db.select().from(examTickets)
      .where(and(eq(examTickets.examId, examId), eq(examTickets.assignedTo, studentId)))
      .limit(1);

    if (!ticket) return null;

    const [session] = await db.select().from(examSessions)
      .where(and(eq(examSessions.ticketId, ticket.id), eq(examSessions.studentId, studentId)))
      .limit(1);

    if (!session) return null;

    const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
    const [subject] = exam ? await db.select().from(subjects).where(eq(subjects.id, exam.subjectId!)).limit(1) : [null];
    const [teacher] = exam ? await db.select().from(users).where(eq(users.id, exam.teacherId!)).limit(1) : [null];

    const ticketQuestions = await db.select().from(questions)
      .where(inArray(questions.id, ticket.questionIds || []));

    const savedAnswers = await db.select().from(studentAnswers)
      .where(eq(studentAnswers.sessionId, session.id));

    const savedAnswersMap: Record<number, string> = {};
    savedAnswers.forEach((a) => {
      savedAnswersMap[a.questionId!] = a.answerText || "";
    });

    const durationMs = (exam?.durationMinutes || 60) * 60 * 1000;
    const endTime = session.startedAt
      ? new Date(new Date(session.startedAt).getTime() + durationMs).toISOString()
      : null;

    return {
      sessionId: session.id,
      examId: exam?.id,
      examName: exam?.name || "",
      subjectName: subject?.name || "",
      teacherName: teacher?.fullName || "",
      durationMinutes: exam?.durationMinutes || 60,
      startedAt: session.startedAt,
      endTime,
      questions: ticketQuestions.map((q, index) => ({
        id: q.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        order: index + 1,
      })),
      savedAnswers: savedAnswersMap,
    };
  },

  async saveStudentAnswer(sessionId: number, questionId: number, answerText: string): Promise<void> {
    const existing = await db.select().from(studentAnswers)
      .where(and(eq(studentAnswers.sessionId, sessionId), eq(studentAnswers.questionId, questionId)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(studentAnswers)
        .set({ answerText, answeredAt: new Date() })
        .where(and(eq(studentAnswers.sessionId, sessionId), eq(studentAnswers.questionId, questionId)));
    } else {
      await db.insert(studentAnswers).values({
        sessionId,
        questionId,
        answerText,
        answeredAt: new Date(),
      });
    }
  },

  async recordViolation(sessionId: number, type: string): Promise<void> {
    const [session] = await db.select().from(examSessions).where(eq(examSessions.id, sessionId)).limit(1);
    if (session) {
      const currentViolations = session.violationDetails ? JSON.parse(JSON.stringify(session.violationDetails)) : [];
      currentViolations.push({ type, timestamp: new Date() });

      await db.update(examSessions)
        .set({
          violationsCount: (session.violationsCount || 0) + 1,
          violationDetails: currentViolations,
        })
        .where(eq(examSessions.id, sessionId));
    }
  },

  async submitExamSession(sessionId: number): Promise<void> {
    await db.update(examSessions)
      .set({ status: "submitted", submittedAt: new Date() })
      .where(eq(examSessions.id, sessionId));
  },

  async getSessionAnswersForGrading(sessionId: number): Promise<{
    answerId: number;
    questionId: number;
    questionText: string;
    sampleAnswer: string | null;
    keywords: string[];
    answerText: string | null;
  }[]> {
    const results = await db
      .select({
        answerId: studentAnswers.id,
        questionId: studentAnswers.questionId,
        questionText: questions.questionText,
        sampleAnswer: questions.sampleAnswer,
        keywords: questions.keywords,
        answerText: studentAnswers.answerText,
      })
      .from(studentAnswers)
      .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
      .where(eq(studentAnswers.sessionId, sessionId));

    return results.map(r => ({
      answerId: r.answerId,
      questionId: r.questionId || 0,
      questionText: r.questionText || "",
      sampleAnswer: r.sampleAnswer,
      keywords: Array.isArray(r.keywords) ? r.keywords : [],
      answerText: r.answerText,
    }));
  },

  async updateAnswerGrade(answerId: number, score: string, feedback: object): Promise<void> {
    await db.update(studentAnswers)
      .set({
        aiScore: score,
        aiFeedback: feedback,
      })
      .where(eq(studentAnswers.id, answerId));
  },

  async getTeacherExamResults(teacherId: number, examIdFilter?: number): Promise<any[]> {
    const baseQuery = db
      .select({
        sessionId: examSessions.id,
        studentId: examSessions.studentId,
        studentName: users.fullName,
        examId: examSessions.examId,
        examName: exams.name,
        status: examSessions.status,
        startedAt: examSessions.startedAt,
        submittedAt: examSessions.submittedAt,
        violationsCount: examSessions.violationsCount,
        ticketNumber: examTickets.ticketNumber,
        subjectName: subjects.name,
        groupName: studentGroups.name,
      })
      .from(examSessions)
      .innerJoin(exams, eq(examSessions.examId, exams.id))
      .innerJoin(users, eq(examSessions.studentId, users.id))
      .innerJoin(examTickets, eq(examSessions.ticketId, examTickets.id))
      .innerJoin(subjects, eq(exams.subjectId, subjects.id))
      .leftJoin(studentGroups, eq(users.groupId, studentGroups.id));

    let sessions;
    if (examIdFilter) {
      sessions = await baseQuery
        .where(and(eq(exams.teacherId, teacherId), eq(exams.id, examIdFilter)))
        .orderBy(desc(examSessions.submittedAt));
    } else {
      sessions = await baseQuery
        .where(eq(exams.teacherId, teacherId))
        .orderBy(desc(examSessions.submittedAt));
    }

    const results = await Promise.all(sessions.map(async (session) => {
      const answers = await db
        .select({
          aiScore: studentAnswers.aiScore,
        })
        .from(studentAnswers)
        .where(eq(studentAnswers.sessionId, session.sessionId));

      const totalScore = answers.reduce((sum, a) => sum + (parseFloat(a.aiScore || "0")), 0);
      const maxScore = answers.length * 15;

      return {
        ...session,
        totalScore,
        maxScore,
        answersCount: answers.length,
      };
    }));

    return results;
  },

  async getSessionDetails(sessionId: number, teacherId: number): Promise<any | null> {
    const [session] = await db
      .select({
        sessionId: examSessions.id,
        studentId: examSessions.studentId,
        studentName: users.fullName,
        examId: examSessions.examId,
        examName: exams.name,
        status: examSessions.status,
        startedAt: examSessions.startedAt,
        submittedAt: examSessions.submittedAt,
        violationsCount: examSessions.violationsCount,
        violationDetails: examSessions.violationDetails,
        ticketNumber: examTickets.ticketNumber,
        subjectName: subjects.name,
        groupName: studentGroups.name,
      })
      .from(examSessions)
      .innerJoin(exams, eq(examSessions.examId, exams.id))
      .innerJoin(users, eq(examSessions.studentId, users.id))
      .innerJoin(examTickets, eq(examSessions.ticketId, examTickets.id))
      .innerJoin(subjects, eq(exams.subjectId, subjects.id))
      .leftJoin(studentGroups, eq(users.groupId, studentGroups.id))
      .where(and(eq(examSessions.id, sessionId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!session) return null;

    const answers = await db
      .select({
        id: studentAnswers.id,
        questionId: studentAnswers.questionId,
        questionText: questions.questionText,
        sampleAnswer: questions.sampleAnswer,
        keywords: questions.keywords,
        answerText: studentAnswers.answerText,
        aiScore: studentAnswers.aiScore,
        aiFeedback: studentAnswers.aiFeedback,
        manualScore: studentAnswers.manualScore,
        manualComment: studentAnswers.manualComment,
        answeredAt: studentAnswers.answeredAt,
      })
      .from(studentAnswers)
      .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
      .where(eq(studentAnswers.sessionId, sessionId));

    return {
      ...session,
      answers,
    };
  },

  async updateAnswerManualScore(answerId: number, score: number, comment: string): Promise<void> {
    await db.update(studentAnswers)
      .set({
        manualScore: score.toString(),
        manualComment: comment,
      })
      .where(eq(studentAnswers.id, answerId));
  },

  async getExamExportData(examId: number, teacherId: number): Promise<any> {
    const [exam] = await db
      .select({
        id: exams.id,
        name: exams.name,
        subjectName: subjects.name,
        examDate: exams.examDate,
        targetGroups: exams.targetGroups,
      })
      .from(exams)
      .innerJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) return null;

    const sessions = await db
      .select({
        sessionId: examSessions.id,
        studentId: examSessions.studentId,
        studentName: users.fullName,
        status: examSessions.status,
        submittedAt: examSessions.submittedAt,
        violationsCount: examSessions.violationsCount,
        ticketNumber: examTickets.ticketNumber,
        groupName: studentGroups.name,
      })
      .from(examSessions)
      .innerJoin(users, eq(examSessions.studentId, users.id))
      .innerJoin(examTickets, eq(examSessions.ticketId, examTickets.id))
      .leftJoin(studentGroups, eq(users.groupId, studentGroups.id))
      .where(eq(examSessions.examId, examId));

    const results = await Promise.all(sessions.map(async (session) => {
      const answers = await db
        .select({
          aiScore: studentAnswers.aiScore,
          manualScore: studentAnswers.manualScore,
        })
        .from(studentAnswers)
        .where(eq(studentAnswers.sessionId, session.sessionId));

      const totalScore = answers.reduce((sum, a) => {
        const score = a.manualScore ? parseFloat(a.manualScore) : parseFloat(a.aiScore || "0");
        return sum + score;
      }, 0);
      const maxScore = answers.length * 15;

      return {
        ...session,
        totalScore,
        maxScore,
        percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      };
    }));

    return {
      exam,
      results,
    };
  },

  async getExamMonitoringData(examId: number, teacherId: number): Promise<any> {
    const [exam] = await db
      .select({
        id: exams.id,
        name: exams.name,
        subjectName: subjects.name,
        durationMinutes: exams.durationMinutes,
        startTime: exams.startTime,
        examDate: exams.examDate,
        status: exams.status,
        targetGroups: exams.targetGroups,
      })
      .from(exams)
      .innerJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) throw new Error("Imtihon topilmadi");

    const groupIds = exam.targetGroups || [];

    let studentsFromGroups: { id: number; fullName: string; groupId: number | null; groupName: string | null }[] = [];

    if (groupIds.length > 0) {
      studentsFromGroups = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          groupId: users.groupId,
          groupName: studentGroups.name,
        })
        .from(users)
        .leftJoin(studentGroups, eq(users.groupId, studentGroups.id))
        .where(and(eq(users.role, "talaba"), inArray(users.groupId, groupIds)));
    }

    const studentsFromSessions = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        groupId: users.groupId,
        groupName: studentGroups.name,
      })
      .from(examSessions)
      .innerJoin(users, eq(examSessions.studentId, users.id))
      .leftJoin(studentGroups, eq(users.groupId, studentGroups.id))
      .where(eq(examSessions.examId, examId));

    const studentMap = new Map<number, { id: number; fullName: string; groupId: number | null; groupName: string | null }>();
    for (const s of studentsFromGroups) {
      studentMap.set(s.id, s);
    }
    for (const s of studentsFromSessions) {
      if (!studentMap.has(s.id)) {
        studentMap.set(s.id, s);
      }
    }
    const allStudents = Array.from(studentMap.values());

    const sessions = await db
      .select({
        id: examSessions.id,
        studentId: examSessions.studentId,
        status: examSessions.status,
        startedAt: examSessions.startedAt,
        submittedAt: examSessions.submittedAt,
        tabSwitches: examSessions.tabSwitches,
        ticketId: examSessions.ticketId,
      })
      .from(examSessions)
      .where(eq(examSessions.examId, examId));

    const sessionMap = new Map(sessions.map(s => [s.studentId, s]));

    const sessionIds = sessions.map(s => s.id);
    const allAnswers = sessionIds.length > 0
      ? await db.select().from(studentAnswers).where(inArray(studentAnswers.sessionId, sessionIds))
      : [];
    const answersMap = new Map<number, typeof allAnswers>();
    for (const answer of allAnswers) {
      if (!answersMap.has(answer.sessionId)) {
        answersMap.set(answer.sessionId, []);
      }
      answersMap.get(answer.sessionId)!.push(answer);
    }

    const ticketIds = sessions.filter(s => s.ticketId).map(s => s.ticketId!);
    const allTickets = ticketIds.length > 0
      ? await db.select().from(examTickets).where(inArray(examTickets.id, ticketIds))
      : [];
    const ticketsMap = new Map(allTickets.map(t => [t.id, t]));

    const [examForQuestionCount] = await db.select({ questionsPerTicket: exams.questionsPerTicket })
      .from(exams).where(eq(exams.id, examId)).limit(1);
    const defaultQuestionCount = examForQuestionCount?.questionsPerTicket || 5;

    const students = allStudents.map((student) => {
      const session = sessionMap.get(student.id);
      let answeredCount = 0;
      let totalQuestions = defaultQuestionCount;
      let timeSpent = "00:00";

      if (session) {
        if (session.ticketId) {
          const ticket = ticketsMap.get(session.ticketId);
          totalQuestions = ticket?.questionIds?.length || defaultQuestionCount;
        }

        const sessionAnswers = answersMap.get(session.id) || [];
        answeredCount = sessionAnswers.filter(a => a.answerText && a.answerText.trim().length > 0).length;

        if (session.startedAt) {
          const startTime = new Date(session.startedAt).getTime();
          const endTime = session.submittedAt ? new Date(session.submittedAt).getTime() : Date.now();
          const elapsed = Math.floor((endTime - startTime) / 1000);
          const mins = Math.floor(elapsed / 60);
          const secs = elapsed % 60;
          timeSpent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
      }

      let status: "waiting" | "in_progress" | "submitted" | "disqualified" = "waiting";
      if (session?.status === "submitted") status = "submitted";
      else if (session?.status === "in_progress") status = "in_progress";
      else if ((session?.tabSwitches || 0) >= 3) status = "disqualified";

      return {
        id: student.id,
        fullName: student.fullName,
        groupName: student.groupName || "",
        status,
        answeredCount,
        totalQuestions,
        timeSpent,
        tabSwitches: session?.tabSwitches || 0,
        sessionId: session?.id,
      };
    });

    const started = students.filter(s => s.status !== "waiting").length;
    const submitted = students.filter(s => s.status === "submitted").length;
    const problematic = students.filter(s => s.tabSwitches > 0).length;

    const now = new Date();
    const examStart = new Date(`${exam.examDate}T${exam.startTime}`);
    const examEnd = new Date(examStart.getTime() + (exam.durationMinutes || 60) * 60 * 1000);
    const remainingSeconds = Math.max(0, Math.floor((examEnd.getTime() - now.getTime()) / 1000));

    const activities = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(sql`${activityLogs.details}->>'examId' = ${examId.toString()}`)
      .orderBy(desc(activityLogs.createdAt))
      .limit(50);

    const activityList = await Promise.all(activities.map(async (a) => {
      const [student] = await db.select().from(users).where(eq(users.id, a.userId || 0)).limit(1);
      const details = a.details as any;

      let type: "start" | "answer" | "warning" | "disqualified" | "submit" = "start";
      let actionText = a.action;

      if (a.action.includes("savol")) type = "answer";
      else if (a.action.includes("sahifadan chiqdi") || a.action.includes("ogohlantirish")) {
        type = details?.count >= 3 ? "disqualified" : "warning";
      }
      else if (a.action.includes("topshir")) type = "submit";

      return {
        id: a.id,
        studentName: student?.fullName || "Noma'lum",
        action: actionText,
        type,
        timestamp: a.createdAt,
      };
    }));

    return {
      exam: {
        id: exam.id,
        name: exam.name,
        subjectName: exam.subjectName,
        durationMinutes: exam.durationMinutes,
        startTime: exam.startTime,
        status: exam.status,
      },
      stats: {
        total: students.length,
        started,
        submitted,
        problematic,
      },
      students,
      activities: activityList,
      remainingSeconds,
    };
  },

  async endExam(examId: number, teacherId: number): Promise<void> {
    const [exam] = await db.select().from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);
    if (!exam) throw new Error("Imtihon topilmadi");

    await db.update(exams).set({ status: "completed" }).where(eq(exams.id, examId));

    await db.update(examSessions)
      .set({ status: "submitted", submittedAt: new Date() })
      .where(and(eq(examSessions.examId, examId), eq(examSessions.status, "in_progress")));
  },

  async addExamTime(examId: number, teacherId: number, minutes: number): Promise<void> {
    const [exam] = await db.select().from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);
    if (!exam) throw new Error("Imtihon topilmadi");

    const newDuration = (exam.durationMinutes || 60) + minutes;
    await db.update(exams).set({ durationMinutes: newDuration }).where(eq(exams.id, examId));
  },
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  },

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return false;

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) return false;

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
    return true;
  },
};

