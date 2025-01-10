import { PlanWithProduct } from "@/lib/stripe";
import { NavItem } from "@/web/types";
import { DEFAULT_PLAN, DEFAULT_PLAN_OBJECT } from "./plan";
import { icons } from "lucide-react";
import {
  getBaseAppLink,
  getChatAssistantLink,
  getProfileLink,
  getPromptsLink,
  getSubscriptionLink,
} from "@/lib/private-links";
import { getLoginLink } from "@/lib/public-links";

export const POST_GENERATOR = "post-generator" as const;
export const POST_IMAGE_GENERATOR = "image-social-post-generator" as const;
export const ARTICLE_SUMMARIZER = "article-summarizer" as const;
export const DOCUMENT_CHAT = "document-chat" as const;
export const TEXT_DATA_FINDER = "text-data-finder" as const;
export const RAG_QUERY_IMPROVER = "rag-query-improver" as const;
export const EMBEDDINGS_SUMMARIZER = "embeddings-summarizer-for-ai" as const;

export const AI_CHAT_PROMPT_SLUG = "social-media-post-ideas-assistant";

export const PROMPTS = {
  POST_GENERATOR,
  POST_IMAGE_GENERATOR,
  ARTICLE_SUMMARIZER,
  TEXT_DATA_FINDER,
  DOCUMENT_CHAT,
} as const;

export const DEFAULT_LANGUAGE = "cs" as const;
export const SUPPORTED_LANGUAGES = [
  DEFAULT_LANGUAGE,
  "sk",
  "en",
  "pl",
] as const;

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
  {
    id: ARTICLE_SUMMARIZER,
    prompt: ARTICLE_SUMMARIZER,
    title: "articleSummarizerPromptTitle",
    description: "articleSummarizerPromptDescription",
    defaultLength: 300,
    image: false,
  },
  {
    id: DOCUMENT_CHAT,
    prompt: DOCUMENT_CHAT,
    title: "documentChatPromptTitle",
    description: "documentChatPromptDescription",
    defaultLength: 300,
    image: false,
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

export const RANDOM_ARTICLES = (t: (key: string) => string) => [
  t("prompt.randomArticle.LOCAL_SINGER"),
  t("prompt.randomArticle.LOCAL_ACTOR"),
  t("prompt.randomArticle.LOCAL_ACTRESS"),
  t("prompt.randomArticle.LOCAL_MUSICIAN"),
  t("prompt.randomArticle.LOCAL_CHEF"),
  t("prompt.randomArticle.LOCAL_WRITER"),
  t("prompt.randomArticle.LOCAL_AUTHOR"),
];

export const RANDOM_IMAGE_TOPICS = (t: (key: string) => string) => [
  t("prompt.randomTopic.describeImage"),
  t("prompt.randomTopic.createSocialPostFromImage"),
];

export const getNavItems = (
  t: (key: string) => string,
  currentPath: string = "",
): NavItem[] => [
  {
    title: t("menu.dashboard"),
    url: getBaseAppLink(),
    icon: "dashboard",
    isActive: currentPath.includes("overview"),
    shortcut: ["d", "d"],
    items: [],
  },
  {
    title: t("menu.promptTemplates"),
    url: getPromptsLink(),
    icon: "wandSparkles",
    shortcut: ["t", "t"],
    isActive:
      currentPath.includes("/prompt") || currentPath.includes("/prompts"),
    items: [],
    // items: [
    //   {
    //     title: t(`breadCrumbs.${POST_GENERATOR}`),
    //     url: `/prompt/${POST_GENERATOR}`,
    //     icon: "userPen",
    //     isActive: currentPath.includes(`/prompt/${POST_GENERATOR}`),
    //     shortcut: ["p", "p"],
    //   },
    //   {
    //     title: t(`breadCrumbs.${POST_IMAGE_GENERATOR}`),
    //     url: `/prompt/${POST_IMAGE_GENERATOR}`,
    //     isActive: currentPath.includes(`/prompt/${POST_IMAGE_GENERATOR}`),
    //     icon: "userPen",
    //     shortcut: ["i", "i"],
    //   },
    //   {
    //     title: t(`breadCrumbs.${ARTICLE_SUMMARIZER}`),
    //     url: `/prompt/${ARTICLE_SUMMARIZER}`,
    //     isActive: currentPath.includes(`/prompt/${ARTICLE_SUMMARIZER}`),
    //     icon: "userPen",
    //     shortcut: ["a", "a"],
    //   },
    // ],
  },
  {
    title: t("menu.chatAssistant"),
    url: getChatAssistantLink(),
    icon: "bot",
    shortcut: ["c", "c"],
    isActive: currentPath.includes("/chat-assistant"),
    items: [],
  },
  // {
  //   title: t("menu.categories"),
  //   url: "/app/product-categories",
  //   icon: "shoppingBasket",
  //   shortcut: ["x", "x"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.products"),
  //   url: "/app/products",
  //   icon: "package",
  //   shortcut: ["p", "p"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.answers"),
  //   url: "/app/answers",
  //   icon: "notebookPen",
  //   shortcut: ["a", "a"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.productAttributes"),
  //   url: "/app/product-attributes ",
  //   icon: "tag",
  //   shortcut: ["t", "t"],
  //   isActive: false,
  //   items: [],
  // },
  // {
  //   title: t("menu.users"),
  //   url: "/app/users",
  //   icon: "user",
  //   shortcut: ["u", "u"],
  //   isActive: false,
  //   items: [],
  // },
  {
    title: t("menu.account.title"),
    url: getProfileLink(),
    icon: "badgeCheck",
    isActive:
      currentPath.includes(getProfileLink()) ||
      currentPath.includes(getLoginLink()) ||
      currentPath.includes(getSubscriptionLink()),
    items: [
      {
        title: t("menu.account.profile"),
        url: getProfileLink(),
        icon: "userPen",
        shortcut: ["m", "m"],
      },

      {
        title: t("menu.account.subscription"),
        url: getSubscriptionLink(),
        icon: "userPen",
        shortcut: ["m", "m"],
      },

      {
        title: t("menu.account.login"),
        shortcut: ["l", "l"],
        url: getLoginLink(),
        icon: "login",
      },
    ],
  },
];

export const isDefaultPlan = (plan: PlanWithProduct) =>
  plan.product.name.toLowerCase() === DEFAULT_PLAN.toLocaleLowerCase() ||
  plan.id === DEFAULT_PLAN_OBJECT.id;

export const CompanyInfo = {
  name: "AIstein",
  logo: icons.Atom,
};
