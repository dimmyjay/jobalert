export type JobRole = {
  id: string;
  label: string;
  category: string;
  keywords: string[];
};

export const JOB_ROLES: JobRole[] = [
  // Software Development
  {
    id: "frontend-developer",
    label: "Frontend Developer",
    category: "Software Development",
    keywords: [
      "frontend",
      "front-end",
      "react",
      "next.js",
      "vue",
      "angular",
      "javascript",
      "typescript",
      "html",
      "css",
      "tailwind",
    ],
  },
  {
    id: "backend-developer",
    label: "Backend Developer",
    category: "Software Development",
    keywords: [
      "backend",
      "back-end",
      "node.js",
      "express",
      "api",
      "server",
      "database",
      "python",
      "django",
      "laravel",
      "java",
      "php",
    ],
  },
  {
    id: "fullstack-developer",
    label: "Full Stack Developer",
    category: "Software Development",
    keywords: [
      "fullstack",
      "full-stack",
      "full stack",
      "react",
      "next.js",
      "node.js",
      "typescript",
      "javascript",
      "frontend",
      "backend",
    ],
  },
  {
    id: "mobile-app-developer",
    label: "Mobile App Developer",
    category: "Software Development",
    keywords: [
      "mobile",
      "android",
      "ios",
      "react native",
      "flutter",
      "swift",
      "kotlin",
      "mobile developer",
      "app developer",
    ],
  },
  {
    id: "wordpress-developer",
    label: "WordPress Developer",
    category: "Software Development",
    keywords: [
      "wordpress",
      "woocommerce",
      "elementor",
      "php",
      "theme development",
      "plugin",
      "cms",
    ],
  },
  {
    id: "web-developer",
    label: "Web Developer",
    category: "Software Development",
    keywords: [
      "web developer",
      "website",
      "html",
      "css",
      "javascript",
      "frontend",
      "backend",
      "web design",
    ],
  },

  // Data & AI
  {
    id: "ai-engineer",
    label: "AI Engineer",
    category: "Data & AI",
    keywords: [
      "ai engineer",
      "artificial intelligence",
      "machine learning",
      "llm",
      "openai",
      "groq",
      "langchain",
      "python",
      "automation",
    ],
  },
  {
    id: "machine-learning-engineer",
    label: "Machine Learning Engineer",
    category: "Data & AI",
    keywords: [
      "machine learning",
      "ml engineer",
      "tensorflow",
      "pytorch",
      "model training",
      "python",
      "data science",
    ],
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    category: "Data & AI",
    keywords: [
      "data analyst",
      "excel",
      "sql",
      "power bi",
      "tableau",
      "analytics",
      "reporting",
      "dashboard",
    ],
  },
  {
    id: "data-scientist",
    label: "Data Scientist",
    category: "Data & AI",
    keywords: [
      "data scientist",
      "python",
      "machine learning",
      "statistics",
      "data science",
      "pandas",
      "numpy",
      "analytics",
    ],
  },

  // Cloud, DevOps & Security
  {
    id: "devops-engineer",
    label: "DevOps Engineer",
    category: "Cloud & DevOps",
    keywords: [
      "devops",
      "docker",
      "kubernetes",
      "ci/cd",
      "aws",
      "azure",
      "gcp",
      "terraform",
      "linux",
    ],
  },
  {
    id: "cloud-engineer",
    label: "Cloud Engineer",
    category: "Cloud & DevOps",
    keywords: [
      "cloud engineer",
      "aws",
      "azure",
      "google cloud",
      "gcp",
      "cloud infrastructure",
      "serverless",
    ],
  },
  {
    id: "cybersecurity-analyst",
    label: "Cybersecurity Analyst",
    category: "Cloud & DevOps",
    keywords: [
      "cybersecurity",
      "security analyst",
      "soc",
      "network security",
      "penetration testing",
      "vulnerability",
      "security",
    ],
  },
  {
    id: "system-administrator",
    label: "System Administrator",
    category: "Cloud & DevOps",
    keywords: [
      "system administrator",
      "sysadmin",
      "linux",
      "windows server",
      "network",
      "it support",
      "server",
    ],
  },

  // Design & Creative
  {
    id: "ui-ux-designer",
    label: "UI/UX Designer",
    category: "Design & Creative",
    keywords: [
      "ui designer",
      "ux designer",
      "ui/ux",
      "figma",
      "product design",
      "wireframe",
      "prototype",
      "user experience",
    ],
  },
  {
    id: "graphic-designer",
    label: "Graphic Designer",
    category: "Design & Creative",
    keywords: [
      "graphic designer",
      "photoshop",
      "illustrator",
      "canva",
      "branding",
      "flyer",
      "poster",
      "logo",
    ],
  },
  {
    id: "video-editor",
    label: "Video Editor",
    category: "Design & Creative",
    keywords: [
      "video editor",
      "premiere pro",
      "after effects",
      "capcut",
      "youtube editor",
      "motion graphics",
      "video editing",
    ],
  },
  {
    id: "content-creator",
    label: "Content Creator",
    category: "Design & Creative",
    keywords: [
      "content creator",
      "social media content",
      "creator",
      "video content",
      "copywriting",
      "content production",
    ],
  },

  // Marketing & Sales
  {
    id: "digital-marketer",
    label: "Digital Marketer",
    category: "Marketing & Sales",
    keywords: [
      "digital marketer",
      "seo",
      "sem",
      "google ads",
      "facebook ads",
      "marketing",
      "online marketing",
    ],
  },
  {
    id: "social-media-manager",
    label: "Social Media Manager",
    category: "Marketing & Sales",
    keywords: [
      "social media manager",
      "instagram",
      "facebook",
      "tiktok",
      "content calendar",
      "community manager",
    ],
  },
  {
    id: "seo-specialist",
    label: "SEO Specialist",
    category: "Marketing & Sales",
    keywords: [
      "seo",
      "seo specialist",
      "search engine optimization",
      "keyword research",
      "backlinks",
      "technical seo",
    ],
  },
  {
    id: "sales-representative",
    label: "Sales Representative",
    category: "Marketing & Sales",
    keywords: [
      "sales representative",
      "sales",
      "business development",
      "lead generation",
      "customer acquisition",
    ],
  },

  // Admin & Support
  {
    id: "virtual-assistant",
    label: "Virtual Assistant",
    category: "Admin & Support",
    keywords: [
      "virtual assistant",
      "va",
      "admin assistant",
      "remote assistant",
      "calendar management",
      "email management",
    ],
  },
  {
    id: "customer-support",
    label: "Customer Support",
    category: "Admin & Support",
    keywords: [
      "customer support",
      "customer service",
      "support agent",
      "help desk",
      "live chat",
      "call center",
    ],
  },
  {
    id: "data-entry",
    label: "Data Entry",
    category: "Admin & Support",
    keywords: [
      "data entry",
      "typing",
      "excel",
      "spreadsheet",
      "admin",
      "clerical",
      "records",
    ],
  },
  {
    id: "project-manager",
    label: "Project Manager",
    category: "Admin & Support",
    keywords: [
      "project manager",
      "scrum",
      "agile",
      "project coordinator",
      "productivity",
      "team management",
    ],
  },

  // Writing & Education
  {
    id: "content-writer",
    label: "Content Writer",
    category: "Writing & Education",
    keywords: [
      "content writer",
      "blog writer",
      "copywriter",
      "article writer",
      "seo writer",
      "writing",
    ],
  },
  {
    id: "copywriter",
    label: "Copywriter",
    category: "Writing & Education",
    keywords: [
      "copywriter",
      "sales copy",
      "email copy",
      "landing page copy",
      "advertising copy",
      "marketing copy",
    ],
  },
  {
    id: "online-tutor",
    label: "Online Tutor",
    category: "Writing & Education",
    keywords: [
      "online tutor",
      "teacher",
      "tutor",
      "education",
      "teaching",
      "elearning",
      "remote tutor",
    ],
  },

  // Finance & Business
  {
    id: "accountant",
    label: "Accountant",
    category: "Finance & Business",
    keywords: [
      "accountant",
      "accounting",
      "bookkeeping",
      "quickbooks",
      "finance",
      "tax",
      "payroll",
    ],
  },
  {
    id: "business-analyst",
    label: "Business Analyst",
    category: "Finance & Business",
    keywords: [
      "business analyst",
      "requirements",
      "process improvement",
      "business analysis",
      "stakeholder",
      "documentation",
    ],
  },
  {
    id: "product-manager",
    label: "Product Manager",
    category: "Finance & Business",
    keywords: [
      "product manager",
      "product owner",
      "roadmap",
      "product strategy",
      "agile",
      "saas",
    ],
  },
];

export const JOB_ROLES_BY_CATEGORY: Record<string, JobRole[]> =
  JOB_ROLES.reduce((acc, role) => {
    if (!acc[role.category]) {
      acc[role.category] = [];
    }

    acc[role.category].push(role);

    return acc;
  }, {} as Record<string, JobRole[]>);

export function getJobRoleById(roleId: string): JobRole | undefined {
  return JOB_ROLES.find((role) => role.id === roleId);
}

export function getJobRoleLabels(roleIds: string[]): string[] {
  return roleIds.map((id) => getJobRoleById(id)?.label || id);
}

export function getJobRoleKeywords(roleIds: string[]): string[] {
  const keywords = roleIds.flatMap((id) => {
    const role = getJobRoleById(id);
    return role?.keywords || [id];
  });

  return Array.from(new Set(keywords));
}

export function searchJobRoles(query: string): JobRole[] {
  const q = query.toLowerCase().trim();

  if (!q) {
    return JOB_ROLES;
  }

  return JOB_ROLES.filter((role) => {
    return (
      role.id.toLowerCase().includes(q) ||
      role.label.toLowerCase().includes(q) ||
      role.category.toLowerCase().includes(q) ||
      role.keywords.some((keyword) => keyword.toLowerCase().includes(q))
    );
  });
}