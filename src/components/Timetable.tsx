import { useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Share2
} from "lucide-react";
import { cn } from "../lib/utils";
import { Student, Course, Schedule } from "../types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export default function Timetable({ student, courses }: { student: Student | null, courses: Course[] }) {
  const enrolledCourses = courses.filter(c => student?.enrolledCourses?.includes(c.id));
  
  // Mock schedules for demo purposes
  const schedules: Schedule[] = useMemo(() => {
    return enrolledCourses.flatMap((course, idx) => {
      // Generate some deterministic mock schedules if none exist
      if (course.schedules && course.schedules.length > 0) return course.schedules;
      
      const dayIndex = (idx % 5);
      const startHour = 9 + (idx % 4) * 2;
      
      return [{
        id: `sched-${course.id}`,
        courseId: course.id,
        day: DAYS[dayIndex] as any,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${(startHour + 1).toString().padStart(2, '0')}:30`,
        location: `Hall ${100 + idx * 5}`
      }];
    });
  }, [enrolledCourses]);

  const getCourseAt = (day: string, hour: number) => {
    return schedules.find(s => {
      const startHour = parseInt(s.startTime.split(":")[0]);
      return s.day === day && startHour === hour;
    });
  };

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">My Timetable</h2>
          <p className="text-white/40">Visualizing your weekly academic commitments.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center gap-2 text-xs font-medium transition-all">
            <Share2 size={16} /> Share
          </button>
          <button className="px-4 py-2 bg-[#F27D26] hover:bg-[#FF8C3B] text-black rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-[#F27D26]/20">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#0D0D0D] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
        {/* Timetable Header */}
        <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5 bg-white/[0.02]">
          <div className="p-4 border-r border-white/5" />
          {DAYS.map(day => (
            <div key={day} className="p-4 text-center border-r border-white/5 last:border-r-0">
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">{day}</span>
            </div>
          ))}
        </div>

        {/* Timetable Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr] border-b border-white/5 last:border-b-0 min-h-[100px]">
              <div className="p-4 border-r border-white/5 flex items-start justify-center">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>
              {DAYS.map(day => {
                const schedule = getCourseAt(day, hour);
                const course = schedule ? courses.find(c => c.id === schedule.courseId) : null;
                
                return (
                  <div key={`${day}-${hour}`} className="p-2 border-r border-white/5 last:border-r-0 relative group">
                    {course && schedule && (
                      <div className="h-full w-full p-3 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-xl flex flex-col justify-between hover:bg-[#F27D26]/20 transition-all cursor-pointer">
                        <div>
                          <p className="text-[9px] font-mono text-[#F27D26] uppercase tracking-wider mb-1">{course.code}</p>
                          <p className="text-[11px] font-bold leading-tight line-clamp-2">{course.title}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[9px] text-white/40">
                            <Clock size={10} /> {schedule.startTime} - {schedule.endTime}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-white/40">
                            <MapPin size={10} /> {schedule.location}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
