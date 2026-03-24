import React, { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Star, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Info,
  ChevronRight,
  Plus,
  Minus,
  AlertTriangle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Student, Course } from "../types";

export default function CourseCatalog({ student, courses, isAdmin, onUpdate }: { student: Student | null, courses: Course[], isAdmin: boolean, onUpdate: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    name: "",
    code: "",
    credits: 3,
    instructor: "",
    max_seats: 30,
    description: "",
    faculty: "Computer Science"
  });

  const categories = ["All", "Computer Science", "Mathematics", "Physics", "Business", "Arts"];

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           course.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || course.faculty === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  const calculateFitScore = (course: Course) => {
    let score = 0;
    if (student?.major === course.faculty) score += 40;
    if (course.difficulty < 3) score += 20;
    if (course.rating > 4) score += 20;
    if (student?.creditsCompleted && student.creditsCompleted > 30) score += 20;
    return Math.min(score, 100);
  };

  const handleRegister = async (course: Course) => {
    if (!student) return;
    setRegistering(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: student.uid,
          courseCode: course.code
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedCourse(null);
        onUpdate(); // Immediate refresh
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRegistering(false);
    }
  };

  const handleDrop = async (course: Course) => {
    if (!student) return;
    setRegistering(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: student.uid,
          courseCode: course.code
        })
      });

      if (res.ok) {
        setSelectedCourse(null);
      } else {
        const data = await res.json();
        setError(data.error || "Drop failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setRegistering(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setError(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourseData)
      });
      if (res.ok) {
        setIsAddingCourse(false);
        setNewCourseData({
          name: "",
          code: "",
          credits: 3,
          instructor: "",
          max_seats: 30,
          description: "",
          faculty: "Computer Science"
        });
        onUpdate();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add course");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="flex h-full gap-8">
      {/* Catalog List */}
      <div className="flex-1 space-y-8 overflow-y-auto pr-4 scrollbar-hide">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Course Catalog</h2>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={() => setIsAddingCourse(true)}
                className="px-4 py-2 bg-[#F27D26] text-black text-xs font-bold rounded-xl hover:bg-[#FF8C3B] transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Add Course
              </button>
            )}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 text-xs font-medium rounded-lg transition-all",
                    selectedCategory === cat ? "bg-[#F27D26] text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredCourses.map(course => {
            const fitScore = calculateFitScore(course);
            const isEnrolled = student?.enrolledCourses?.includes(course.id);
            const isWaitlisted = student?.waitlistedCourses?.includes(course.id);
            const isFull = course.enrolledCount >= course.capacity;
            
            return (
              <motion.div
                key={course.id}
                layoutId={course.id}
                onClick={() => setSelectedCourse(course)}
                className={cn(
                  "p-6 bg-[#0D0D0D] rounded-3xl border border-white/5 hover:border-[#F27D26]/30 transition-all cursor-pointer group relative overflow-hidden",
                  isEnrolled && "border-green-500/30",
                  isWaitlisted && "border-yellow-500/30"
                )}
              >
                {isEnrolled && (
                  <div className="absolute top-0 right-0 p-4">
                    <CheckCircle2 size={16} className="text-green-500" />
                  </div>
                )}
                {isWaitlisted && (
                  <div className="absolute top-0 right-0 p-4">
                    <Clock size={16} className="text-yellow-500" />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white/5 text-white/60 text-[10px] font-mono rounded uppercase tracking-wider">
                      {course.code}
                    </span>
                    <span className="px-2 py-1 bg-[#F27D26]/10 text-[#F27D26] text-[10px] font-mono rounded uppercase tracking-wider flex items-center gap-1">
                      <Zap size={10} /> {fitScore}% Fit
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-[#F27D26] transition-colors">{course.title}</h3>
                <p className="text-xs text-white/40 mb-6 line-clamp-2">{course.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold">{course.rating}</span>
                    </div>
                    <div className="text-[10px] text-white/20 uppercase tracking-widest font-mono">
                      {course.faculty}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#F27D26]" 
                        style={{ width: `${(course.enrolledCount / course.capacity) * 100}%` }} 
                      />
                    </div>
                    <span className="text-[10px] text-white/40">{course.enrolledCount}/{course.capacity}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Course Detail Panel */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.aside
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-[400px] bg-[#0D0D0D] border-l border-white/5 p-8 overflow-y-auto scrollbar-hide flex flex-col"
          >
            <button 
              onClick={() => setSelectedCourse(null)}
              className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl mb-8 hover:bg-white/10 transition-all"
            >
              <ChevronRight size={20} />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#F27D26]/10 text-[#F27D26] text-xs font-mono rounded-lg uppercase tracking-wider">
                  {selectedCourse.code}
                </span>
                <span className="text-white/20 text-xs">{selectedCourse.credits} Credits</span>
              </div>
              
              <h2 className="text-3xl font-bold mb-4 leading-tight">{selectedCourse.title}</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8">{selectedCourse.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <DetailCard label="Faculty" value={selectedCourse.faculty} />
                <DetailCard label="Difficulty" value={`${selectedCourse.difficulty}/5`} />
                <DetailCard label="Rating" value={`${selectedCourse.rating}/5`} />
                <DetailCard label="Capacity" value={`${selectedCourse.enrolledCount}/${selectedCourse.capacity}`} />
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Prerequisites</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.prerequisites.length > 0 ? selectedCourse.prerequisites.map(p => (
                      <span key={p} className={cn(
                        "px-3 py-1 rounded-lg text-xs border",
                        student?.enrolledCourses?.includes(p) 
                          ? "bg-green-500/10 border-green-500/20 text-green-500" 
                          : "bg-white/5 border-white/10 text-white/40"
                      )}>
                        {p}
                      </span>
                    )) : <span className="text-xs text-white/20 italic">None</span>}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 mb-6">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-500 leading-relaxed">{error}</p>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/5">
              {student?.enrolledCourses?.includes(selectedCourse.id) || student?.waitlistedCourses?.includes(selectedCourse.id) ? (
                <button 
                  onClick={() => handleDrop(selectedCourse)}
                  disabled={registering}
                  className="w-full py-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-white/60 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/5"
                >
                  <Minus size={20} />
                  {student?.waitlistedCourses?.includes(selectedCourse.id) ? "Leave Waitlist" : "Drop Course"}
                </button>
              ) : (
                <button 
                  onClick={() => handleRegister(selectedCourse)}
                  disabled={registering}
                  className={cn(
                    "w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(242,125,38,0.1)]",
                    selectedCourse.enrolledCount >= selectedCourse.capacity 
                      ? "bg-yellow-500 hover:bg-yellow-600 text-black" 
                      : "bg-[#F27D26] hover:bg-[#FF8C3B] text-black"
                  )}
                >
                  {registering ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      {selectedCourse.enrolledCount >= selectedCourse.capacity ? (
                        <>
                          <Clock size={20} />
                          Join Waitlist
                        </>
                      ) : (
                        <>
                          <Plus size={20} />
                          Register Now
                        </>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* Add Course Modal */}
      <AnimatePresence>
        {isAddingCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingCourse(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0D0D0D] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Add New Course</h3>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono mt-1">Catalog Expansion</p>
                </div>
                <button 
                  onClick={() => setIsAddingCourse(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCourse} className="space-y-4">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  <ModalInput label="Course Name" value={newCourseData.name} onChange={v => setNewCourseData({...newCourseData, name: v})} placeholder="e.g. Quantum Computing" />
                  <ModalInput label="Course Code" value={newCourseData.code} onChange={v => setNewCourseData({...newCourseData, code: v})} placeholder="e.g. PHYS402" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <ModalInput label="Credits" type="number" value={newCourseData.credits.toString()} onChange={v => setNewCourseData({...newCourseData, credits: parseInt(v)})} />
                    <ModalInput label="Max Seats" type="number" value={newCourseData.max_seats.toString()} onChange={v => setNewCourseData({...newCourseData, max_seats: parseInt(v)})} />
                  </div>

                  <ModalInput label="Instructor" value={newCourseData.instructor} onChange={v => setNewCourseData({...newCourseData, instructor: v})} placeholder="Dr. Name" />
                  
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">Faculty</label>
                    <select 
                      value={newCourseData.faculty}
                      onChange={e => setNewCourseData({...newCourseData, faculty: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F27D26]/50 transition-all appearance-none"
                    >
                      {categories.filter(c => c !== "All").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <ModalInput label="Description" value={newCourseData.description} onChange={v => setNewCourseData({...newCourseData, description: v})} placeholder="Brief course overview..." />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-500 leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingCourse(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={registering}
                    className="flex-[2] py-4 bg-[#F27D26] hover:bg-[#FF8C3B] text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    {registering ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Plus size={18} />}
                    Create Course
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalInput({ label, value, onChange, type = "text", placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F27D26]/50 transition-all placeholder:text-white/10"
      />
    </div>
  );
}

function DetailCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
      <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
