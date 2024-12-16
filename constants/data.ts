import { NavItem } from "@/web/types";

export const POST_GENERATOR = "post-generator" as const;
export const POST_IMAGE_GENERATOR = "image-social-post-generator" as const;

export const PROMPTS = {
  POST_GENERATOR,
  POST_IMAGE_GENERATOR,
} as const;

export type PROMPTS_UNION = typeof POST_GENERATOR;

export const USED_PROMPTS = [
  {
    id: POST_GENERATOR,
    prompt: POST_GENERATOR,
    title: "generateSocialPostContentPromptTitle",
    description: "generateSocialPostContentPromptDescription",
    defaultLength: 200,
    image: false,
  },
  {
    id: POST_IMAGE_GENERATOR,
    prompt: POST_IMAGE_GENERATOR,
    title: "generateSocialPostImageContentPromptTitle",
    description: "generateSocialPostImageContentPromptDescription",
    defaultLength: 200,
    image: true,
  },
] as const;

export type UsedPromptType = (typeof USED_PROMPTS)[number];

export const RANDOM_TOPICS = (t: (key: string) => string) => [
  t("prompt.randomTopic.POLITICS"),
  t("prompt.randomTopic.LOCAL_SINGER"),
  t("prompt.randomTopic.LOCAL_ACTOR"),
  t("prompt.randomTopic.LOCAL_ACTRESS"),
  t("prompt.randomTopic.LOCAL_MUSICIAN"),
  t("prompt.randomTopic.LOCAL_CHEF"),
  t("prompt.randomTopic.LOCAL_CHEF"),
  t("prompt.randomTopic.LOCAL_WRITER"),
  t("prompt.randomTopic.LOCAL_AUTHOR"),
  t("prompt.randomTopic.RAPPER"),
  t("prompt.randomTopic.ARTIST"),
  t("prompt.randomTopic.SCANDALOUS_CELEBRITY"),
  t("prompt.randomTopic.CURRENT_LOCAL_REALITY_SHOW"),
  t("prompt.randomTopic.CURRENT_LOCAL_REALITY_SHOW_HOST"),
];

export const RANDOM_IMAGE_TOPICS = (t: (key: string) => string) => [
  t("prompt.randomTopic.describeImage"),
  t("prompt.randomTopic.createSocialPostFromImage"),
];

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
    title: t("menu.promptTemplates"),
    url: "/prompts",
    icon: "fileQuestion",
    shortcut: ["t", "t"],
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
  // {
  //   title: t("menu.categories"),
  //   url: "/product-categories",
  //   icon: "shoppingBasket",
  //   shortcut: ["x", "x"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.products"),
  //   url: "/products",
  //   icon: "package",
  //   shortcut: ["p", "p"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.answers"),
  //   url: "/answers",
  //   icon: "notebookPen",
  //   shortcut: ["a", "a"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.productAttributes"),
  //   url: "/product-attributes ",
  //   icon: "tag",
  //   shortcut: ["t", "t"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.users"),
  //   url: "/users",
  //   icon: "user",
  //   shortcut: ["u", "u"],
  //   isActive: false,
  //   items: [],
  // },
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
