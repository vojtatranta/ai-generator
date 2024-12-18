"use client";
import { memo, useMemo, useState, type FC } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  User,
} from "lucide-react";
import { type ChatCompletionChunk } from "openai/resources/chat/completions";
import { MemoizedLangtailMarkdownBlock } from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const UserMessage = memo(function UserMessage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group relative flex items-start md:-ml-12", className)}>
      <div className="flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
        <User size={16} strokeWidth={1.5} />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2">
        {children}
      </div>
    </div>
  );
});

export const SpinnerMessage = memo(function SpinnerMessage() {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <Bot size={16} strokeWidth={1.5} />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2">
        <Loader2 className="my-2 animate-spin" />
      </div>
    </div>
  );
});

export function getPossibleJSONResult(toolResult: string | null | undefined) {
  try {
    return JSON.stringify(JSON.parse(toolResult ?? ""), null, 2);
  } catch (e) {
    return toolResult;
  }
}

export const AssistantToolCallMessage = memo(function AssistantToolCallMessage({
  children,
  title,
  toolCalls,
  toolCallId,
  className,
}: {
  children: React.ReactNode;
  title: string;
  toolCalls: ChatCompletionChunk[];
  toolCallId: string;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCompleted = toolCalls.some((call) =>
    call.choices.some(
      (choice) =>
        choice.delta &&
        "tool_call_id" in choice.delta &&
        choice.delta.tool_call_id === toolCallId,
    ),
  );

  const isLoading = !isCompleted;

  const flattenedChoices = useMemo(
    () => toolCalls.flatMap((call) => call.choices),
    [toolCalls],
  );

  const toolResult = flattenedChoices.find(
    (choice) =>
      "tool_call_id" in choice.delta &&
      choice.delta.tool_call_id === toolCallId,
  )?.delta?.content;

  const handleClick = () => {
    setIsExpanded((prev) => !prev);
  };
  return (
    <div className={cn("m-2 w-full max-w-full rounded-lg md:-ml-4", className)}>
      <Badge className="max-w-[250px] cursor-pointer items-center justify-between bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
        <div onClick={handleClick} className="flex items-center">
          <span className="flex items-center overflow-hidden">
            <span className="flex-shrink-0">
              {isLoading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin dark:text-blue-400" />
              ) : isCompleted ? (
                <Check className="mr-2 h-3 w-3 dark:text-green-400" />
              ) : null}
            </span>
            <span className="truncate">{title.replace(/_/g, " ")}</span>
          </span>
          {isExpanded ? (
            <ChevronDown className="ml-2 h-3 w-3 flex-shrink-0 dark:text-gray-400" />
          ) : (
            <ChevronRight className="ml-2 h-3 w-3 flex-shrink-0 dark:text-gray-400" />
          )}
        </div>
      </Badge>
    </div>
  );
});

export const BotMessage = memo(function BotMessage({
  content,
  className,
}: {
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group relative flex items-start md:-ml-12", className)}>
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
        <Bot size={16} strokeWidth={1.5} />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <MessageContent content={content} />
      </div>
    </div>
  );
});

export const MessageContent = memo(function MessageContent({
  content,
  className,
  loading = false,
}: {
  content: React.ReactNode;
  className?: string;
  loading?: boolean;
}) {
  return typeof content === "string" ? (
    <MemoizedLangtailMarkdownBlock className={className} loading={loading}>
      {content}
    </MemoizedLangtailMarkdownBlock>
  ) : (
    content
  );
});
