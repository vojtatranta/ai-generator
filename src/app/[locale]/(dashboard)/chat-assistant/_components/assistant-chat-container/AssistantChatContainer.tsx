"use client";
import { memo, useState, type FC } from "react";
import { useChatStream, type ChatMessage } from "langtail/react/useChatStream";
import { readableStreamFromSSEResponse } from "langtail/stream";
import { BugPlay, CircleAlert } from "lucide-react";
import { type ChatCompletionChunk } from "openai/resources/chat/completions";
import ReactMarkdown, { type Options } from "react-markdown";
import { MemoizedLangtailMarkdownBlock } from "@/components/Markdown";
import { Separator } from "@/components/ui/separator";
import {
  AssistantToolCallMessage,
  BotMessage,
  getPossibleJSONResult,
  SpinnerMessage,
  UserMessage,
} from "./AssistantChat";
import { AssistantChatPromptForm } from "./AssistantChatForm";

export function renderMessageContent(
  message:
    | null
    | string
    | (
        | {
            type: "text";
            text: string;
          }
        | {
            type: "image_url";
            image_url: {
              detail: string;
              url: string;
            };
          }
      )[],
) {
  if (typeof message === "string" || !message) {
    return message;
  }

  return message
    .sort((a) => (a.type === "text" ? -1 : 0))
    .map((desc, index) => {
      if (desc.type === "text") {
        return <div key={index}>{desc.text}</div>;
      }

      return (
        <img
          className="max-w-[200px]"
          alt="AI Generated image"
          key={index}
          src={desc.image_url.url}
        />
      );
    });
}

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);

function renderMessage(message: ChatMessage, toolCalls: ChatCompletionChunk[]) {
  function getContent() {
    switch (message.role) {
      case "assistant":
        return message.tool_calls ? (
          <>
            {message.content && (
              <BotMessage content={renderMessageContent(message.content)} />
            )}
            {message.tool_calls.map((toolCall) => {
              return (
                <AssistantToolCallMessage
                  key={toolCall.id}
                  toolCalls={toolCalls}
                  toolCallId={toolCall.id}
                  title={toolCall.function?.name ?? "tool_call"}
                >
                  {getPossibleJSONResult(toolCall.function?.arguments ?? "")}
                </AssistantToolCallMessage>
              );
            })}
          </>
        ) : (
          <BotMessage content={renderMessageContent(message.content)} />
        );
      case "user":
        return (
          <UserMessage>{renderMessageContent(message.content)}</UserMessage>
        );

      default:
        return null;
    }
  }

  const content = getContent() ?? null;

  return {
    render: (fn: (content: React.ReactNode) => React.ReactNode) =>
      content ? fn(content) : null,
  };
}

const Header = memo(function Header() {
  return <></>;
});

const EmptyScreen = memo(function EmptyScreen({
  description,
}: {
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <MemoizedLangtailMarkdownBlock>
          {description}
        </MemoizedLangtailMarkdownBlock>
      </div>
    </div>
  );
});

export const Chat = memo(function Chat({
  messages,
  isGenerating,
  errorDescriptor,
  toolCalls,
}: {
  messages: ChatMessage[];
  isGenerating: boolean;
  errorDescriptor: {
    error: string;
    messageIndex: number;
  } | null;
  toolCalls: ChatCompletionChunk[];
}) {
  return (
    <div className="group w-full pl-2 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
      {messages.map((message, index) =>
        renderMessage(message, toolCalls).render((content) => (
          <div key={`${String(message.content)}-${index}`}>
            {content}
            {errorDescriptor?.messageIndex === index && (
              <div className="my-2 max-w-xs rounded border bg-red-900 p-2 text-xs dark:border-red-700 dark:bg-red-100 dark:text-red-800 md:-ml-4">
                <CircleAlert className="mr-2 inline-block h-4 w-4" />
                {errorDescriptor.error}
              </div>
            )}
            {index < messages.length - 1 && <Separator className="my-4" />}
          </div>
        )),
      )}
      {isGenerating && messages.at(-1)?.role === "user" && (
        <>
          <Separator className="my-4" />
          <SpinnerMessage />
          <div className="h-px w-full" />
        </>
      )}
      <div className="h-px w-full" />
    </div>
  );
});

export function getErrorDetails(error: unknown): {
  message: string;
  code: string | null;
} {
  if (!error || typeof error !== "object" || error === null) {
    return {
      message: "Unknown error",
      code: null,
    };
  }

  const message =
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "message" in error.error
      ? String(error.error.message)
      : "Unknown error";

  const code =
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "code" in error.error
      ? String(error.error.code)
      : null;

  return {
    message,
    code,
  };
}

export const AssistantAIChatContainer = memo(function AssistantAIChatContainer({
  description,
  imageSupport,
  variables,
}: {
  description?: string;
  imageSupport?: boolean;
  variables?: Record<string, any>;
}) {
  const [input, setInput] = useState("");
  const [toolCalls, setToolCalls] = useState<ChatCompletionChunk[]>([]);
  const [image, setImage] = useState("");
  const [error, setError] = useState<{
    error: string;
    messageIndex: number;
  } | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const { abort, messages, isLoading, send } = useChatStream({
    fetcher: (sentMessages, _opts, abortController) => {
      return fetch(`/api/assistant-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
        credentials: "include",
        body: JSON.stringify({
          assistant: true,
          threadId,
          messages: sentMessages,
          variables: variables ?? {},
        }),
      }).then((res) => {
        const headerValue = res.headers.get("x-langtail-thread-id");
        if (headerValue) {
          setThreadId(headerValue);
        }
        const contentType = res.headers.get("content-type");
        console.log("content", contentType);
        if (contentType && contentType.includes("text/event-stream")) {
          return readableStreamFromSSEResponse(res, abortController);
        } else {
          // NOTE: error responses aren't streams
          return res.json().then((error: unknown) => {
            const errorDetails = getErrorDetails(error);
            if (errorDetails.message) {
              setError({
                error: errorDetails.message,
                messageIndex: messages.length,
              });

              if ("parent" in window && window.parent) {
                window.parent.postMessage(
                  {
                    type: "embed-assistant-error",
                    ...errorDetails,
                  },
                  "*",
                );
              }
            }

            return null;
          });
        }
      });
    },
    onError: (error) => {
      const errorDetails = getErrorDetails(error);
      if (!errorDetails.message) {
        return;
      }

      setError({
        error: errorDetails.message,
        messageIndex: messages.length,
      });
    },
    onChunk: (message) => {
      setToolCalls((toolCalls) => [
        ...toolCalls,
        ...[message].filter((message) =>
          message.choices.some(
            // @ts-expect-error: weirdo
            (choice) =>
              choice.delta?.role === "tool" || choice.delta?.tool_calls,
          ),
        ),
      ]);
    },
  });

  return (
    <div className="flex h-dvh flex-1 flex-col bg-muted/30">
      <Header
      // displayPlaygroundButton={userInOrganization && !isEmbed}
      // organizationSlug={organizationSlug}
      // projectSlug={projectSlug}
      // assistantSlug={assistantSlug}
      />
      <div className=":is(.dark .dark\:to-background\/20) fixed inset-x-0 bottom-0 w-full overflow-auto bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
        <div className="relative flex h-[calc(100vh_-_theme(spacing.16))]">
          <div className="mx-auto w-full sm:max-w-2xl sm:px-4 ">
            <div className="flex h-dvh w-full flex-1 flex-col">
              <div className="w-full pb-[200px] pt-4 md:pt-10">
                {messages.length === 0 && description && (
                  <EmptyScreen description={description} />
                )}
                {messages.length > 0 && (
                  <Chat
                    errorDescriptor={error}
                    messages={messages}
                    isGenerating={isLoading}
                    toolCalls={toolCalls}
                  />
                )}
              </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
              <div className="mx-auto sm:max-w-2xl sm:px-4">
                <div className="space-y-4 border-t bg-background py-2 shadow-lg sm:rounded-t-xl sm:border sm:px-4 md:py-4">
                  <AssistantChatPromptForm
                    input={input}
                    image={image}
                    loading={isLoading}
                    send={send}
                    abort={abort}
                    imageSupport={Boolean(imageSupport)}
                    setInput={setInput}
                    setImage={setImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
