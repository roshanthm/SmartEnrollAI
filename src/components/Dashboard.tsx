import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  BookOpen
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { Student, Course } from "../types";
import { cn } from "../lib/utils";

const gpaData = [
  { semester: "Sem 1", gpa: 3.8 },
  { semester: "Sem 2", gpa: 3.9 },
  { semester: "Sem 3", gpa: 3.7 },
  { semester: "Sem 4", gpa: 4.0 },
];

const creditData = [
  { name: "Completed", value: 45, color: "#F27D26" },
  { name: "In Progress", value: 15, color: "#3B82F6" },
  { name: "Remaining", value: 60, color: "#1A1A1A" },
];

export default function Dashboard({ student, courses }: { student: Student | null, courses: Course[] }) {
  const enrolledCourses = courses.filter(c => student?.enrolledCourses?.includes(c.id));
  const waitlistedCourses = courses.filter(c => student?.waitlistedCourses?.includes(c.id));
  const totalCredits = enrolledCourses.reduce((acc, curr) => acc + curr.credits, 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {student?.name?.split(' ')[0] || "Student"}</h2>
          <p className="text-white/40">Here's what's happening with your academic progress today.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-white/60">Registration Open</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Award className="text-[#F27D26]" size={20} />} 
          label="Current GPA" 
          value={student?.gpa?.toFixed(2) || "0.00"} 
          trend="+0.2 from last sem"
          trendUp={true}
        />
        <StatCard 
          icon={<CheckCircle2 className="text-green-500" size={20} />} 
          label="Credits Completed" 
          value={student?.creditsCompleted?.toString() || "0"} 
          trend="75% of degree"
        />
        <StatCard 
          icon={<Clock className="text-blue-500" size={20} />} 
          label="Credits In Progress" 
          value={totalCredits?.toString() || "0"} 
          trend="5 active courses"
        />
        <StatCard 
          icon={<TrendingUp className="text-purple-500" size={20} />} 
          label="Academic Rank" 
          value="Top 5%" 
          trend="Dean's List candidate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GPA Chart */}
        <div className="lg:col-span-2 bg-[#0D0D0D] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold">GPA Performance</h3>
            <select className="bg-white/5 border-none outline-none text-xs rounded-lg px-3 py-2 text-white/60">
              <option>All Semesters</option>
              <option>Last 2 Semesters</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gpaData}>
                <defs>
                  <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="semester" 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 4.0]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#F27D26' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="gpa" 
                  stroke="#F27D26" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorGpa)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit Distribution */}
        <div className="bg-[#0D0D0D] rounded-3xl p-8 border border-white/5">
          <h3 className="text-lg font-semibold mb-8">Credit Distribution</h3>
          <div className="h-[250px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                  {creditData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {creditData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-white/60">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.value} Credits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waitlisted Courses */}
      {waitlistedCourses.length > 0 && (
        <div className="bg-[#0D0D0D] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Waitlisted Courses</h3>
              <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
                Pending
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {waitlistedCourses.map((course) => (
              <div key={course.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 blur-2xl rounded-full -mr-8 -mt-8" />
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-mono rounded uppercase tracking-wider">
                    {course.code}
                  </span>
                  <span className="text-white/20 text-xs">{course.credits} Credits</span>
                </div>
                <h4 className="font-semibold mb-2 group-hover:text-yellow-500 transition-colors">{course.title}</h4>
                <p className="text-xs text-white/40 mb-6 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                      {course.faculty.charAt(0)}
                    </div>
                    <span className="text-[10px] text-white/60">{course.faculty}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-yellow-500" />
                    <span className="text-[10px] text-yellow-500">Waitlisted</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Courses */}
      <div className="bg-[#0D0D0D] rounded-3xl p-8 border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold">Active Enrollments</h3>
          <button className="text-xs text-[#F27D26] hover:underline flex items-center gap-1">
            View Full Schedule <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.length > 0 ? enrolledCourses.map((course) => (
            <div key={course.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#F27D26]/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-[#F27D26]/10 text-[#F27D26] text-[10px] font-mono rounded uppercase tracking-wider">
                  {course.code}
                </span>
                <span className="text-white/20 text-xs">{course.credits} Credits</span>
              </div>
              <h4 className="font-semibold mb-2 group-hover:text-[#F27D26] transition-colors">{course.title}</h4>
              <p className="text-xs text-white/40 mb-6 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                    {course.faculty.charAt(0)}
                  </div>
                  <span className="text-[10px] text-white/60">{course.faculty}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle size={12} className="text-yellow-500" />
                  <span className="text-[10px] text-yellow-500">Exam in 4 days</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
              <BookOpen size={48} className="mb-4 opacity-20" />
              <p>No active enrollments found.</p>
              <p className="text-xs">Head to the Course Catalog to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, trendUp }: { icon: React.ReactNode, label: string, value: string, trend: string, trendUp?: boolean }) {
  return (
    <div className="bg-[#0D0D0D] p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs text-white/40 uppercase tracking-widest font-mono">{label}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className={cn(
        "text-[10px] font-medium",
        trendUp ? "text-green-500" : "text-white/30"
      )}>
        {trend}
      </p>
    </div>
  );
}
