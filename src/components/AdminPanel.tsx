import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Course } from "../types";

export default function AdminPanel({ onUpdate }: { onUpdate: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: 3,
    instructor: "",
    max_seats: 30,
    description: "",
    faculty: "Computer Science",
    prerequisiteIds: [] as string[]
  });

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
        waitlistCount: c.waitlist_count || 0
      })));
      setLoading(false);
    } catch (err) {
      setError("Failed to load courses");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(editingId ? "Course updated successfully" : "Course added successfully");
        setFormData({
          name: "",
          code: "",
          credits: 3,
          instructor: "",
          max_seats: 30,
          description: "",
          faculty: "Computer Science",
          prerequisiteIds: []
        });
        setEditingId(null);
        fetchCourses();
        onUpdate();
      } else {
        const data = await res.json();
        setError(data.error || "Operation failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Course deleted");
        fetchCourses();
        onUpdate();
      }
    } catch (err) {
      setError("Delete failed");
    }
  };

  const startEdit = (course: any) => {
    setEditingId(course.id);
    setFormData({
      name: course.name,
      code: course.code,
      credits: course.credits,
      instructor: course.instructor,
      max_seats: course.max_seats,
      description: course.description,
      faculty: course.faculty,
      prerequisiteIds: course.prerequisiteIds || []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Admin Control Panel</h2>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">System Management & Course Orchestration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-[#0D0D0D] p-8 rounded-3xl border border-white/5 sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              {editingId ? <Edit2 size={20} className="text-[#F27D26]" /> : <Plus size={20} className="text-[#F27D26]" />}
              {editingId ? "Edit Course" : "Add New Course"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Course Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Advanced AI" />
              <Input label="Course Code" value={formData.code} onChange={v => setFormData({...formData, code: v})} placeholder="e.g. CS404" />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Credits" type="number" value={formData.credits.toString()} onChange={v => setFormData({...formData, credits: parseInt(v)})} />
                <Input label="Max Seats" type="number" value={formData.max_seats.toString()} onChange={v => setFormData({...formData, max_seats: parseInt(v)})} />
              </div>

              <Input label="Instructor" value={formData.instructor} onChange={v => setFormData({...formData, instructor: v})} placeholder="Dr. Name" />
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">Faculty</label>
                <select 
                  value={formData.faculty}
                  onChange={e => setFormData({...formData, faculty: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#F27D26]/50 transition-all appearance-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Business">Business</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">Prerequisites</label>
                <div className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 scrollbar-hide">
                  {courses
                    .filter(c => c.id.toString() !== editingId?.toString())
                    .map(course => {
                      const isSelected = formData.prerequisiteIds.includes(course.id.toString());
                      return (
                        <div 
                          key={course.id} 
                          onClick={() => {
                            const current = formData.prerequisiteIds;
                            const id = course.id.toString();
                            if (isSelected) {
                              setFormData({ ...formData, prerequisiteIds: current.filter(i => i !== id) });
                            } else {
                              setFormData({ ...formData, prerequisiteIds: [...current, id] });
                            }
                          }}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div 
                            className={cn(
                              "w-5 h-5 rounded border transition-all flex items-center justify-center",
                              isSelected
                                ? "bg-[#F27D26] border-[#F27D26]"
                                : "border-white/20 group-hover:border-white/40"
                            )}
                          >
                            {isSelected && <div className="w-2 h-2 bg-black rounded-sm" />}
                          </div>
                          <span className={cn(
                            "text-xs transition-colors",
                            isSelected ? "text-white" : "text-white/60 group-hover:text-white"
                          )}>
                            {course.code} - {course.name}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#F27D26] hover:bg-[#FF8C3B] text-black font-bold rounded-2xl transition-all shadow-lg shadow-[#F27D26]/10 flex items-center justify-center gap-2"
                >
                  {editingId ? <Save size={18} /> : <Plus size={18} />}
                  {editingId ? "Save Changes" : "Create Course"}
                </button>
                
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => { setEditingId(null); setFormData({ name: "", code: "", credits: 3, instructor: "", max_seats: 30, description: "", faculty: "Computer Science", prerequisiteIds: [] }); }}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs">
                  <AlertCircle size={16} /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-500 text-xs">
                  <CheckCircle2 size={16} /> {success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-[#0D0D0D] rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Active Course Inventory</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/20 font-mono">
                    <th className="p-6">Code</th>
                    <th className="p-6">Course Name</th>
                    <th className="p-6">Instructor</th>
                    <th className="p-6 text-center">Seats</th>
                    <th className="p-6 text-center">Waitlist</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {courses.map((course: any) => (
                    <tr key={course.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-6">
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-white/60">{course.code}</span>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-semibold">{course.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] text-white/30 mr-2">{course.faculty}</span>
                          {course.prerequisites && course.prerequisites.map((p: string) => (
                            <span key={p} className="text-[9px] px-1 bg-white/5 border border-white/5 rounded text-white/40">{p}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-6 text-sm text-white/60">{course.instructor}</td>
                      <td className="p-6 text-center">
                        <span className="text-xs font-mono">{course.enrolledCount}/{course.capacity}</span>
                      </td>
                      <td className="p-6 text-center">
                        <span className={cn(
                          "text-xs font-mono",
                          course.waitlistCount > 0 ? "text-yellow-500" : "text-white/20"
                        )}>
                          {course.waitlistCount}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEdit(course)}
                            className="p-2 hover:bg-[#F27D26]/10 hover:text-[#F27D26] rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(course.id)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
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
