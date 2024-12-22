import { AI_CHAT_PROMPT_SLUG } from "@/constants/data";

export const getPromptLink = (promptSlug: string): string => {
  if (promptSlug === AI_CHAT_PROMPT_SLUG) {
    return getChatAssistantLink();
  }

  return `/app/prompt/${promptSlug}`;
};

export const getUserDetailLink = (userId: string): string => {
  return `/app/user/${userId}`;
};

export const getProfileLink = (): string => {
  return `/app/profile`;
};

export const getSubscriptionLink = (): string => {
  return "/app/subscription";
};

export const getBaseAppLink = (): string => {
  return "/app/overview";
};

export const getChatAssistantLink = (): string => {
  return "/app/chat-assistant";
};

export const getPromptsLink = (): string => {
  return "/app/prompts";
};
