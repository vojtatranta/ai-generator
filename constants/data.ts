import { NavItem } from "@/web/types";

export const POST_GENERATOR = "post-generator" as const;

export const PROMPTS = {
  POST_GENERATOR,
} as const;

export type PROMPTS_UNION = typeof POST_GENERATOR;

export type User = {
  id: number;
  name: string;
  company: string;
  role: string;
  verified: boolean;
  status: string;
};
export const users: User[] = [
  {
    id: 1,
    name: "Candice Schiner",
    company: "Dell",
    role: "Frontend Developer",
    verified: false,
    status: "Active",
  },
  {
    id: 2,
    name: "John Doe",
    company: "TechCorp",
    role: "Backend Developer",
    verified: true,
    status: "Active",
  },
  {
    id: 3,
    name: "Alice Johnson",
    company: "WebTech",
    role: "UI Designer",
    verified: true,
    status: "Active",
  },
  {
    id: 4,
    name: "David Smith",
    company: "Innovate Inc.",
    role: "Fullstack Developer",
    verified: false,
    status: "Inactive",
  },
  {
    id: 5,
    name: "Emma Wilson",
    company: "TechGuru",
    role: "Product Manager",
    verified: true,
    status: "Active",
  },
  {
    id: 6,
    name: "James Brown",
    company: "CodeGenius",
    role: "QA Engineer",
    verified: false,
    status: "Active",
  },
  {
    id: 7,
    name: "Laura White",
    company: "SoftWorks",
    role: "UX Designer",
    verified: true,
    status: "Active",
  },
  {
    id: 8,
    name: "Michael Lee",
    company: "DevCraft",
    role: "DevOps Engineer",
    verified: false,
    status: "Active",
  },
  {
    id: 9,
    name: "Olivia Green",
    company: "WebSolutions",
    role: "Frontend Developer",
    verified: true,
    status: "Active",
  },
  {
    id: 10,
    name: "Robert Taylor",
    company: "DataTech",
    role: "Data Analyst",
    verified: false,
    status: "Active",
  },
];

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string; // Consider using a proper date type if possible
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  longitude?: number; // Optional field
  latitude?: number; // Optional field
  job: string;
  profile_picture?: string | null; // Profile picture can be a string (URL) or null (if no picture)
};

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export const getNavItems = (t: (key: string) => string): NavItem[] => [
  {
    title: t("menu.dashboard"),
    url: "/overview",
    icon: "dashboard",
    isActive: false,
    shortcut: ["d", "d"],
    items: [],
  },
  {
    title: t("menu.quizes"),
    url: "/quizes",
    icon: "fileQuestion",
    shortcut: ["s", "s"],
    isActive: false,
    items: [],
  },
  // {
  //   title: t("menu.questions"),
  //   url: "/questions",
  //   icon: "messageCircleQuestion",
  //   shortcut: ["x", "x"],
  //   isActive: false,
  //   items: [],
  // },
  {
    title: t("menu.categories"),
    url: "/product-categories",
    icon: "shoppingBasket",
    shortcut: ["x", "x"],
    isActive: false,
    items: [],
  },
  {
    title: t("menu.products"),
    url: "/products",
    icon: "package",
    shortcut: ["p", "p"],
    isActive: false,
    items: [],
  },
  {
    title: t("menu.answers"),
    url: "/answers",
    icon: "notebookPen",
    shortcut: ["a", "a"],
    isActive: false,
    items: [],
  },
  {
    title: t("menu.productAttributes"),
    url: "/product-attributes ",
    icon: "tag",
    shortcut: ["t", "t"],
    isActive: false,
    items: [],
  },
  {
    title: t("menu.users"),
    url: "/users",
    icon: "user",
    shortcut: ["u", "u"],
    isActive: false,
    items: [],
  },
  {
    title: t("menu.account.title"),
    url: "#",
    icon: "billing",
    isActive: true,
    items: [
      {
        title: t("menu.account.profile"),
        url: "/profile",
        icon: "userPen",
        shortcut: ["m", "m"],
      },

      {
        title: t("menu.account.subscription"),
        url: "/subscription",
        icon: "userPen",
        shortcut: ["m", "m"],
      },

      {
        title: t("menu.account.login"),
        shortcut: ["l", "l"],
        url: "/login",
        icon: "login",
      },
    ],
  },
];
