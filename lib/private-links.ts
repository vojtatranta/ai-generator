import { AI_CHAT_PROMPT_SLUG } from "@/constants/data";

export const getPromptLink = (promptSlug: string): string => {
  if (promptSlug === AI_CHAT_PROMPT_SLUG) {
    return "/chat-assistant";
  }

  return `/prompt/${promptSlug}`;
};
