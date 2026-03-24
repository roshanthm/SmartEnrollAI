import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

const courses = [
  {
    code: "CS101",
    title: "Introduction to Computer Science",
    description: "Fundamental concepts of programming, algorithms, and data structures using Python.",
    credits: 4,
    faculty: "Computer Science",
    rating: 4.8,
    difficulty: 2,
    capacity: 120,
    enrolledCount: 85,
    prerequisites: []
  },
  {
    code: "CS202",
    title: "Data Structures & Algorithms",
    description: "Advanced study of data structures and the analysis of algorithms.",
    credits: 4,
    faculty: "Computer Science",
    rating: 4.5,
    difficulty: 4,
    capacity: 80,
    enrolledCount: 45,
    prerequisites: ["CS101"]
  },
  {
    code: "MATH301",
    title: "Linear Algebra",
    description: "Vector spaces, linear transformations, matrices, and eigenvalues.",
    credits: 3,
    faculty: "Mathematics",
    rating: 4.2,
    difficulty: 3,
    capacity: 60,
    enrolledCount: 30,
    prerequisites: []
  },
  {
    code: "PHYS101",
    title: "General Physics I",
    description: "Mechanics, heat, and sound. Includes laboratory work.",
    credits: 4,
    faculty: "Physics",
    rating: 4.0,
    difficulty: 4,
    capacity: 100,
    enrolledCount: 70,
    prerequisites: []
  },
  {
    code: "BUS101",
    title: "Principles of Management",
    description: "Introduction to management theory and practice in modern organizations.",
    credits: 3,
    faculty: "Business",
    rating: 4.6,
    difficulty: 2,
    capacity: 150,
    enrolledCount: 110,
    prerequisites: []
  },
  {
    code: "ART205",
    title: "Digital Illustration",
    description: "Creating professional digital artwork using industry-standard tools.",
    credits: 3,
    faculty: "Arts",
    rating: 4.9,
    difficulty: 2,
    capacity: 40,
    enrolledCount: 38,
    prerequisites: []
  }
];

export async function seedData() {
  try {
    const coursesRef = collection(db, "courses");
    const snapshot = await getDocs(coursesRef);
    
    if (snapshot.empty) {
      console.log("Seeding initial data...");
      for (const course of courses) {
        await addDoc(coursesRef, course);
      }
      console.log("Seeding complete.");
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "courses");
  }
}
