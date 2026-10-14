/**
 * ============================================================================
 * B.TECH CSE CURRICULUM & SMART TOOLS DATA (src/data/subjects.js)
 * ============================================================================
 * Default semester-wise B.Tech CSE subjects (Semesters 1 to 8), file categories,
 * curated engineering links, and placement preparation modules.
 */

export const DEFAULT_SUBJECTS_BY_SEMESTER = {
  1: [
    "Engineering Mathematics-I",
    "Engineering Physics",
    "Programming in C",
    "Basic Electrical Engineering",
    "Engineering Graphics & Design",
    "Technical English Communication"
  ],
  2: [
    "Engineering Mathematics-II",
    "Data Structures & Applications",
    "Object Oriented Programming with C++",
    "Digital Electronics",
    "Environmental Science",
    "Python Programming Lab"
  ],
  3: [
    "Data Structures & Algorithms",
    "Database Management Systems (DBMS)",
    "Digital Logic & Computer Organization",
    "Discrete Mathematics & Graph Theory",
    "Object Oriented Programming in Java",
    "Unix & Shell Programming"
  ],
  4: [
    "Operating Systems",
    "Computer Networks",
    "Design & Analysis of Algorithms (DAA)",
    "Software Engineering",
    "Microprocessors & Embedded Systems",
    "Probability & Statistics for CSE"
  ],
  5: [
    "Theory of Computation & Automata",
    "Compiler Design",
    "Artificial Intelligence",
    "Web Technologies & Full-Stack Dev",
    "Computer Graphics",
    "Cloud Computing Fundamentals"
  ],
  6: [
    "Machine Learning",
    "Cryptography & Network Security",
    "Distributed Systems",
    "Data Mining & Warehousing",
    "Mobile Application Development",
    "DevOps & Microservices"
  ],
  7: [
    "Deep Learning & Neural Networks",
    "Big Data Analytics",
    "Internet of Things (IoT)",
    "Natural Language Processing",
    "System Design & Scalability",
    "Major Project Phase-I"
  ],
  8: [
    "High Performance Computing",
    "Blockchain Architecture",
    "Information Retrieval",
    "Cyber Forensics & Ethical Hacking",
    "Industry Internship Seminar",
    "Major Project Phase-II"
  ]
};

export const FILE_CATEGORIES = [
  "Notes",
  "Video Lecture / Tutorial",
  "Previous Year Question Paper",
  "Assignment",
  "Lab Manual",
  "Syllabus",
  "Textbook",
  "Project",
  "Photo/Handwritten Notes",
  "Other"
];

export const SEMESTER_LIST = [1, 2, 3, 4, 5, 6, 7, 8];

const CUSTOM_SUBJECTS_STORAGE_KEY = "studyvault_cse_subjects_v2";

/**
 * Retrieve semester-wise subjects.
 * Never regenerates deleted subjects if user emptied a semester.
 */
export function getSubjectsBySemester() {
  try {
    const saved = localStorage.getItem(CUSTOM_SUBJECTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const result = {};
        for (const sem of SEMESTER_LIST) {
          if (Array.isArray(parsed[sem])) {
            result[sem] = parsed[sem];
          } else {
            result[sem] = [];
          }
        }
        return result;
      }
    }
  } catch (err) {
    console.error("Failed to read custom subjects:", err);
  }
  // Return standard default subjects initially if no custom/database record exists
  const initial = {};
  for (const sem of SEMESTER_LIST) {
    initial[sem] = [...(DEFAULT_SUBJECTS_BY_SEMESTER[sem] || [])];
  }
  return initial;
}

/**
 * Save updated subject list for a specific semester
 */
export function saveSubjectsForSemester(semester, subjectList) {
  const current = getSubjectsBySemester();
  const updated = {
    ...current,
    [Number(semester)]: Array.from(new Set((subjectList || []).map((s) => s.trim()).filter(Boolean)))
  };
  localStorage.setItem(CUSTOM_SUBJECTS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Add a single custom subject to a semester (Admin-Guarded)
 */
export function addCustomSubjectToSemester(semester, newSubject) {
  const clean = newSubject.trim();
  if (!clean) return getSubjectsBySemester();
  const current = getSubjectsBySemester();
  const existing = current[Number(semester)] || [];
  if (!existing.includes(clean)) {
    return saveSubjectsForSemester(semester, [...existing, clean]);
  }
  return current;
}

/**
 * Remove a single subject from a semester (Admin-Guarded)
 */
export function removeCustomSubjectFromSemester(semester, subjectToRemove) {
  const clean = subjectToRemove.trim().toLowerCase();
  const current = getSubjectsBySemester();
  const existing = current[Number(semester)] || [];
  const updatedList = existing.filter((s) => s.trim().toLowerCase() !== clean);
  return saveSubjectsForSemester(semester, updatedList);
}

/**
 * Store the complete subjects map (e.g. synchronized from Supabase)
 */
export function saveAllSubjectsMap(subjectsMap) {
  const cleanMap = {};
  for (const sem of SEMESTER_LIST) {
    cleanMap[sem] = Array.isArray(subjectsMap[sem]) ? subjectsMap[sem] : [];
  }
  localStorage.setItem(CUSTOM_SUBJECTS_STORAGE_KEY, JSON.stringify(cleanMap));
  return cleanMap;
}

/**
 * Reset subjects to default B.Tech CSE curriculum
 */
export function resetSubjectsToDefault() {
  const initial = {};
  for (const sem of SEMESTER_LIST) {
    initial[sem] = [...(DEFAULT_SUBJECTS_BY_SEMESTER[sem] || [])];
  }
  localStorage.setItem(CUSTOM_SUBJECTS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

/**
 * Curated Important Links Hub for B.Tech CSE Students
 */
export const IMPORTANT_CSE_LINKS = [
  {
    name: "LeetCode",
    category: "DSA & Coding Interviews",
    url: "https://leetcode.com",
    description: "Practice top 150 interview questions, weekly contests, and company-tagged DSA problem sets."
  },
  {
    name: "GitHub",
    category: "Open Source & Repositories",
    url: "https://github.com",
    description: "Host your semester projects, build your developer portfolio, and collaborate with version control."
  },
  {
    name: "GeeksforGeeks",
    category: "Core CS Subjects & Tutorials",
    url: "https://www.geeksforgeeks.org",
    description: "Quick revision articles for OS, DBMS, Computer Networks, C++, Java, and company interview experiences."
  },
  {
    name: "NPTEL Swayam",
    category: "IIT Video Lectures",
    url: "https://nptel.ac.in",
    description: "Official IIT & IISc video courses aligned with AICTE B.Tech Computer Science curriculum."
  },
  {
    name: "roadmap.sh",
    category: "Developer Career Paths",
    url: "https://roadmap.sh",
    description: "Interactive step-by-step roadmaps for Frontend, Backend, DevOps, AI/ML, and Computer Science."
  },
  {
    name: "HackerRank",
    category: "Skill Assessments",
    url: "https://www.hackerrank.com",
    description: "SQL, Python, Problem Solving, and Rest API certifications frequently used in campus OA rounds."
  },
  {
    name: "Coursera",
    category: "University Specializations",
    url: "https://www.coursera.org",
    description: "Deep Learning, Andrew Ng ML Specialization, Google Cloud, and Stanford Algorithms courses."
  },
  {
    name: "freeCodeCamp",
    category: "Full-Stack Projects",
    url: "https://www.freecodecamp.org",
    description: "Free interactive project-based curriculum for responsive web design, APIs, and data analysis."
  }
];

/**
 * Pre-configured Placement Preparation Checklist Topics
 */
export const DEFAULT_PLACEMENT_CHECKLIST = [
  {
    id: "dsa-arrays",
    category: "DSA",
    title: "Arrays, Two Pointers, Sliding Window & Prefix Sums",
    completed: true
  },
  {
    id: "dsa-trees",
    category: "DSA",
    title: "Binary Trees, BST, Lowest Common Ancestor & Traversals",
    completed: true
  },
  {
    id: "dsa-graphs",
    category: "DSA",
    title: "Graphs: BFS, DFS, Dijkstra, Topological Sort & DSU",
    completed: false
  },
  {
    id: "dsa-dp",
    category: "DSA",
    title: "Dynamic Programming: Knapsack, LCS, LIS & Grid DP",
    completed: false
  },
  {
    id: "os-proc",
    category: "OS",
    title: "Processes, Threads, CPU Scheduling & Context Switching",
    completed: true
  },
  {
    id: "os-sync",
    category: "OS",
    title: "Process Synchronization, Semaphores, Mutex & Deadlocks (Banker's Algorithm)",
    completed: false
  },
  {
    id: "os-mem",
    category: "OS",
    title: "Virtual Memory, Paging, Segmentation & Page Replacement (LRU/Optimal)",
    completed: false
  },
  {
    id: "dbms-norm",
    category: "DBMS",
    title: "ER Diagrams, Functional Dependencies & Normalization (1NF to BCNF)",
    completed: true
  },
  {
    id: "dbms-acid",
    category: "DBMS",
    title: "Transactions, ACID Properties, Serializability & Indexing (B/B+ Trees)",
    completed: true
  },
  {
    id: "dbms-sql",
    category: "DBMS",
    title: "SQL Joins, Window Functions, Subqueries & Group By Aggregations",
    completed: false
  },
  {
    id: "cn-osi",
    category: "CN",
    title: "OSI & TCP/IP 5-Layer Model, IPv4 Subnetting & ARP/DHCP",
    completed: true
  },
  {
    id: "cn-tcp",
    category: "CN",
    title: "TCP 3-Way Handshake, Flow/Congestion Control, UDP, HTTP/HTTPS & DNS",
    completed: false
  },
  {
    id: "oops-core",
    category: "OOPs",
    title: "Encapsulation, Inheritance, Polymorphism (Compile vs Runtime) & Abstraction",
    completed: true
  },
  {
    id: "oops-adv",
    category: "OOPs",
    title: "Virtual Functions, VTable, Interfaces, Constructors & SOLID Principles",
    completed: false
  },
  {
    id: "apt-quant",
    category: "Aptitude",
    title: "Time & Work, Permutations & Combinations, Probability & Percentages",
    completed: true
  },
  {
    id: "apt-logic",
    category: "Aptitude",
    title: "Seating Arrangements, Syllogisms, Blood Relations & Data Interpretation",
    completed: false
  }
];
