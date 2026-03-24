import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  Search, 
  Bell, 
  Settings,
  GraduationCap,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { cn } from "./lib/utils";
import Dashboard from "./components/Dashboard";
import CourseCatalog from "./components/CourseCatalog";
import Timetable from "./components/Timetable";
import AdminPanel from "./components/AdminPanel";
import { Student, Course, Notification } from "./types";
import ErrorBoundary from "./components/ErrorBoundary";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";

interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "catalog" | "timetable" | "admin">("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data.map((c: any) => ({
        ...c,
        id: c.id.toString(),
        title: c.name,
        capacity: c.max_seats,
        enrolledCount: c.enrolled_count,
        prerequisiteIds: c.prerequisiteIds || []
      })));
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  const fetchNotifications = async (uid: string) => {
    try {
      const res = await fetch(`/api/notifications/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const fetchStudent = async (uid: string) => {
    try {
      const res = await fetch(`/api/students/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setStudent({
          ...data,
          creditsCompleted: data.credits_completed || 0
        });
      } else {
        // Create student if not found
        const createRes = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            name: user?.displayName || "Student",
            email: user?.email || "",
            major: "Computer Science"
          })
        });
        const newData = await createRes.json();
        setStudent({
          ...newData,
          creditsCompleted: newData.credits_completed || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch student", err);
    }
  };

  useEffect(() => {
    // Safety timeout to ensure loading screen is cleared
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        };
        setUser(appUser);
        try {
          // Fetch data in parallel to avoid blocking
          await Promise.all([
            fetchStudent(currentUser.uid),
            fetchCourses(),
            fetchNotifications(currentUser.uid)
          ]);
        } catch (err) {
          console.error("Initial data fetch failed", err);
        }
      } else {
        // Automatically sign in as a guest if no user is found
        const guestUid = "guest_student_001";
        const guestUser: AppUser = {
          uid: guestUid,
          displayName: "Guest Student",
          email: "guest@academia.edu",
          photoURL: null,
        };
        setUser(guestUser);
        try {
          await Promise.all([
            fetchStudent(guestUid),
            fetchCourses(),
            fetchNotifications(guestUid)
          ]);
        } catch (err) {
          console.error("Guest data fetch failed", err);
        }
      }
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const isAdmin = user?.email === "roshanpattathilsep16@gmail.com";

  const refreshData = async () => {
    if (user) {
      await fetchStudent(user.uid);
      await fetchCourses();
      await fetchNotifications(user.uid);
    }
  };

  // Poll for updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = async () => {
    console.log("Login button clicked. Auth initialized:", !!auth);
    const provider = new GoogleAuthProvider();
    try {
      console.log("Attempting signInWithPopup with authDomain:", auth.app.options.authDomain);
      await signInWithPopup(auth, provider);
      console.log("Login successful");
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === "auth/unauthorized-domain") {
        console.error(`Domain Unauthorized: Please add your Netlify domain (${window.location.hostname}) to the "Authorized domains" list in your Firebase Console (Authentication > Settings) for project: ${auth.app.options.authDomain}`);
      } else if (error.code === "auth/popup-blocked") {
        alert("Popup Blocked: Please allow popups for this site to sign in.");
      } else if (error.code === "auth/popup-closed-by-user") {
        // User closed the popup, no need to alert
        console.log("Login popup closed by user.");
      } else if (error.code === "auth/operation-not-allowed") {
        alert("Google Login Not Enabled: Please enable Google as a Sign-in provider in your Firebase Console (Authentication > Sign-in method).");
      } else {
        alert(`Login failed (${error.code}): ${error.message}`);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white flex flex-col items-center gap-4"
        >
          <GraduationCap size={48} className="text-[#F27D26]" />
          <span className="font-mono text-xs tracking-[0.2em] uppercase opacity-50">Initializing Academia...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white flex flex-col items-center gap-4"
        >
          <GraduationCap size={48} className="text-[#F27D26]" />
          <span className="font-mono text-xs tracking-[0.2em] uppercase opacity-50">Preparing Guest Access...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0A0A0A] text-white flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col bg-[#0D0D0D]">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center shadow-lg shadow-[#F27D26]/20">
            <GraduationCap size={20} className="text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">Academia</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label="Course Catalog" 
            active={activeTab === "catalog"} 
            onClick={() => setActiveTab("catalog")} 
          />
          <SidebarItem 
            icon={<Calendar size={20} />} 
            label="My Timetable" 
            active={activeTab === "timetable"} 
            onClick={() => setActiveTab("timetable")} 
          />
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <SidebarItem 
                icon={<ShieldCheck size={20} />} 
                label="Admin Panel" 
                active={activeTab === "admin"} 
                onClick={() => setActiveTab("admin")} 
              />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{student?.name}</p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-wider">{student?.major}</p>
            </div>
          </div>
          <button 
            onClick={user.uid === "guest_student_001" ? handleLogin : handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm"
          >
            {user.uid === "guest_student_001" ? (
              <>
                <GraduationCap size={18} />
                Sign In
              </>
            ) : (
              <>
                <LogOut size={18} />
                Sign Out
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-96">
            <Search size={18} className="text-white/30" />
            <input 
              type="text" 
              placeholder="Search courses, faculty, or codes..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/20"
            />
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <Bell size={20} />
                  {notifications.some(n => !n.is_read) && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F27D26] rounded-full border-2 border-[#0A0A0A]" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-[#1A1A1A] border-white/10 p-4 rounded-2xl shadow-2xl z-[100]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">Notifications</h3>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Recent</span>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-white/30 text-center py-8 italic">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer",
                          n.is_read ? "bg-white/5 border-transparent opacity-60" : "bg-[#F27D26]/5 border-[#F27D26]/20"
                        )}
                        onClick={() => !n.is_read && markNotificationRead(n.id)}
                      >
                        <p className="text-xs leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-white/30 mt-2 font-mono">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <button className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === "dashboard" && <Dashboard student={student} courses={courses} />}
                {activeTab === "catalog" && <CourseCatalog student={student} courses={courses} isAdmin={isAdmin} onUpdate={refreshData} />}
                {activeTab === "timetable" && <Timetable student={student} courses={courses} />}
                {activeTab === "admin" && isAdmin && <AdminPanel onUpdate={refreshData} />}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
        active 
          ? "bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
