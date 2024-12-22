"use client";

import * as React from "react";
import { type ChatMessage } from "langtail/react/useChatStream";
import { Play, StopCircle } from "lucide-react";

import { cn } from "@/web/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { Else, If, Then } from "@/components/ui/condition";

export const AssistantChatPromptForm = React.memo(
  function AssistantChatPromptForm({
    input,
    image,
    imageSupport,
    loading,
    abort,
    send,
    setInput,
    setImage,
  }: {
    input: string;
    image?: string;
    imageSupport: boolean;
    loading: boolean;
    abort?: () => void;
    send: (message: ChatMessage[]) => void;
    setInput: (value: string) => void;
    setImage: (imageBase64: string) => void;
  }) {
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const t = useTranslations("assistantChat");

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);

    const handleSubmit = React.useCallback(
      (e: { preventDefault: () => any }) => {
        e.preventDefault();
        if (loading) {
          abort?.();
          return;
        }

        // Blur focus on mobile
        // if (window.innerWidth < 600) {
        //   e.target["message"]?.blur()
        // }

        const value = input.trim();
        setInput("");
        setImage("");
        if (!value) return;

        // Optimistically add user message UI
        send([
          image
            ? {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      detail: "auto",
                      url: image,
                    },
                  },
                  {
                    type: "text",
                    text: value,
                  },
                ],
              }
            : { role: "user", content: value },
        ]);
      },
      [loading, input, setInput, setImage, send, image, abort],
    );

    return (
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-10 sm:rounded-md sm:border",
            {
              "pl-2": !imageSupport,
            },
          )}
        >
          <Textarea
            onOutline
            ref={inputRef}
            tabIndex={0}
            placeholder={t("sendMessagePlaceholder")}
            className="min-h-[60px] focus:outline-none select:outline-none border-none w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            name="message"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="absolute right-2 top-[13px] sm:right-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="sm"
                  disabled={input === "" && !loading}
                >
                  <If condition={loading}>
                    <Then>
                      <StopCircle size={16} strokeWidth={1.5} />
                    </Then>
                    <Else>
                      <Play size={16} strokeWidth={1.5} />
                    </Else>
                  </If>

                  <span className="sr-only">{t("sendMessage")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("sendMessage")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </form>
    );
  },
);
