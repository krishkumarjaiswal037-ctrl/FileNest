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
    "pps",
    "Programming in C"
  ],
  2: [],
  3: [
    "Data Structures & Algorithms"
  ],
  4: [],
  5: [],
  6: [],
  7: [],
  8: []
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

const CUSTOM_SUBJECTS_STORAGE_KEY = "studyvault_cse_subjects_v3";

/**
 * Retrieve semester-wise subjects.
 * Strictly respects empty semesters: never regenerates deleted subjects.
 */
export function getSubjectsBySemester() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(CUSTOM_SUBJECTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const result = {};
          for (const sem of SEMESTER_LIST) {
            if (Array.isArray(parsed[sem])) {
              result[sem] = parsed[sem];
            } else {
              result[sem] = [...(DEFAULT_SUBJECTS_BY_SEMESTER[sem] || [])];
            }
          }
          return result;
        }
      }
    }
  } catch (err) {
    console.error("Failed to read custom subjects:", err);
  }
  // Return clean initial subjects initially
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
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOM_SUBJECTS_STORAGE_KEY, JSON.stringify(updated));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('filenest_subjects_updated', { detail: updated }));
    }
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
  return updated;
}

/**
 * Add a single custom subject to a semester
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
 * Remove a single subject from a semester
 */
export function removeCustomSubjectFromSemester(semester, subjectToRemove) {
  const clean = subjectToRemove.trim().toLowerCase();
  const current = getSubjectsBySemester();
  const existing = current[Number(semester)] || [];
  const updatedList = existing.filter((s) => s.trim().toLowerCase() !== clean);
  return saveSubjectsForSemester(semester, updatedList);
}

/**
 * Store the complete subjects map (synchronized directly with cloud storage)
 */
export function saveAllSubjectsMap(subjectsMap) {
  const current = getSubjectsBySemester();
  const cleanMap = {};
  for (const sem of SEMESTER_LIST) {
    cleanMap[sem] = Array.isArray(subjectsMap[sem])
      ? subjectsMap[sem]
      : (current[sem] || []);
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOM_SUBJECTS_STORAGE_KEY, JSON.stringify(cleanMap));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('filenest_subjects_updated', { detail: cleanMap }));
    }
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
  return cleanMap;
}

/**
 * Reset subjects to clean state
 */
export function resetSubjectsToDefault() {
  const initial = {};
  for (const sem of SEMESTER_LIST) {
    initial[sem] = [...(DEFAULT_SUBJECTS_BY_SEMESTER[sem] || [])];
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CUSTOM_SUBJECTS_STORAGE_KEY, JSON.stringify(initial));
  }
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
