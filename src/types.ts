export interface Student {
  uid: string;
  name: string;
  email: string;
  major: string;
  creditsCompleted: number;
  gpa: number;
  enrolledCourses: string[];
  waitlistedCourses: string[];
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  faculty: string;
  rating: number;
  difficulty: number;
  capacity: number;
  enrolledCount: number;
  prerequisites: string[];
  prerequisiteIds?: string[];
  schedules?: Schedule[];
}

export interface Schedule {
  id: string;
  courseId: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
}

export interface Notification {
  id: number;
  student_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}
