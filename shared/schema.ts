import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, time, date, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - all roles (registrator, oqituvchi, talaba)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 20 }).notNull().unique(),
  role: varchar("role", { length: 20 }).notNull(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  facultyId: integer("faculty_id"),
  departmentId: integer("department_id"),
  groupId: integer("group_id"),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Faculties table
export const faculties = pgTable("faculties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments (Yo'nalishlar) table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  facultyId: integer("faculty_id").notNull().references(() => faculties.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Groups table
export const studentGroups = pgTable("student_groups", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull().references(() => departments.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  courseYear: integer("course_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subjects (Fanlar) table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  departmentId: integer("department_id").references(() => departments.id),
  credits: integer("credits").default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher-Subject assignments
export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
});

// Lectures table
export const lectures = pgTable("lectures", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 20 }),
  contentText: text("content_text"),
  questionsGenerated: boolean("questions_generated").default(false),
  questionsCount: integer("questions_count").default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  lectureId: integer("lecture_id").references(() => lectures.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id),
  questionText: text("question_text").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"),
  topic: varchar("topic", { length: 100 }),
  maxPoints: decimal("max_points", { precision: 5, scale: 2 }).default("3"),
  keywords: text("keywords").array(),
  sampleAnswer: text("sample_answer"),
  createdAt: timestamp("created_at").defaultNow(),
  isUsed: boolean("is_used").default(false),
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  name: varchar("name", { length: 200 }).notNull(),
  examType: varchar("exam_type", { length: 30 }).notNull(),
  targetGroups: integer("target_groups").array(),
  questionsPerTicket: integer("questions_per_ticket").default(5),
  durationMinutes: integer("duration_minutes").default(60),
  pointsPerQuestion: decimal("points_per_question", { precision: 5, scale: 2 }).default("3"),
  totalPoints: decimal("total_points", { precision: 5, scale: 2 }).default("15"),
  examDate: date("exam_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exam Tickets table
export const examTickets = pgTable("exam_tickets", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  ticketNumber: integer("ticket_number").notNull(),
  questionIds: integer("question_ids").array().notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
});

// Exam Sessions table
export const examSessions = pgTable("exam_sessions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id),
  studentId: integer("student_id").references(() => users.id),
  ticketId: integer("ticket_id").references(() => examTickets.id),
  status: varchar("status", { length: 20 }).default("not_started"),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  tabSwitches: integer("tab_switches").default(0),
  warnings: integer("warnings").default(0),
  totalAiScore: decimal("total_ai_score", { precision: 5, scale: 2 }),
  totalFinalScore: decimal("total_final_score", { precision: 5, scale: 2 }),
  isGraded: boolean("is_graded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Answers table
export const studentAnswers = pgTable("student_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => examSessions.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questions.id),
  answerText: text("answer_text"),
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }),
  aiFeedback: jsonb("ai_feedback"),
  finalScore: decimal("final_score", { precision: 5, scale: 2 }),
  plagiarismPercent: decimal("plagiarism_percent", { precision: 5, scale: 2 }).default("0"),
  answeredAt: timestamp("answered_at").defaultNow(),
});

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userRole: varchar("user_role", { length: 20 }),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [users.facultyId],
    references: [faculties.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  group: one(studentGroups, {
    fields: [users.groupId],
    references: [studentGroups.id],
  }),
  teacherSubjects: many(teacherSubjects),
  lectures: many(lectures),
  examSessions: many(examSessions),
}));

export const facultiesRelations = relations(faculties, ({ many }) => ({
  departments: many(departments),
  users: many(users),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [departments.facultyId],
    references: [faculties.id],
  }),
  groups: many(studentGroups),
  subjects: many(subjects),
}));

export const studentGroupsRelations = relations(studentGroups, ({ one, many }) => ({
  department: one(departments, {
    fields: [studentGroups.departmentId],
    references: [departments.id],
  }),
  students: many(users),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  department: one(departments, {
    fields: [subjects.departmentId],
    references: [departments.id],
  }),
  teacherSubjects: many(teacherSubjects),
  lectures: many(lectures),
  questions: many(questions),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherSubjects.teacherId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [teacherSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const lecturesRelations = relations(lectures, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [lectures.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [lectures.teacherId],
    references: [users.id],
  }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  lecture: one(lectures, {
    fields: [questions.lectureId],
    references: [lectures.id],
  }),
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  teacher: one(users, {
    fields: [exams.teacherId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [exams.subjectId],
    references: [subjects.id],
  }),
  tickets: many(examTickets),
  sessions: many(examSessions),
}));

export const examTicketsRelations = relations(examTickets, ({ one }) => ({
  exam: one(exams, {
    fields: [examTickets.examId],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examTickets.assignedTo],
    references: [users.id],
  }),
}));

export const examSessionsRelations = relations(examSessions, ({ one, many }) => ({
  exam: one(exams, {
    fields: [examSessions.examId],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examSessions.studentId],
    references: [users.id],
  }),
  ticket: one(examTickets, {
    fields: [examSessions.ticketId],
    references: [examTickets.id],
  }),
  answers: many(studentAnswers),
}));

export const studentAnswersRelations = relations(studentAnswers, ({ one }) => ({
  session: one(examSessions, {
    fields: [studentAnswers.sessionId],
    references: [examSessions.id],
  }),
  question: one(questions, {
    fields: [studentAnswers.questionId],
    references: [questions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true });
export const insertFacultySchema = createInsertSchema(faculties).omit({ id: true, createdAt: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export const insertStudentGroupSchema = createInsertSchema(studentGroups).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).omit({ id: true });
export const insertLectureSchema = createInsertSchema(lectures).omit({ id: true, uploadedAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true });
export const insertExamTicketSchema = createInsertSchema(examTickets).omit({ id: true });
export const insertExamSessionSchema = createInsertSchema(examSessions).omit({ id: true, createdAt: true });
export const insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({ id: true, answeredAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Faculty = typeof faculties.$inferSelect;
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type StudentGroup = typeof studentGroups.$inferSelect;
export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;
export type Lecture = typeof lectures.$inferSelect;
export type InsertLecture = z.infer<typeof insertLectureSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type ExamTicket = typeof examTickets.$inferSelect;
export type InsertExamTicket = z.infer<typeof insertExamTicketSchema>;
export type ExamSession = typeof examSessions.$inferSelect;
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = z.infer<typeof insertStudentAnswerSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
