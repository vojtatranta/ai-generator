"use client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { memo } from "react";
import sanitizeHtml from "sanitize-html";

export const QuizResultContainer = memo(function QuizResultContainer({
  descriptionHtml,
  fitContainer,
  quizResultHeadline,
  children,
}: {
  descriptionHtml: string | null;
  fitContainer?: boolean;
  quizResultHeadline: string | null;
  children?: React.ReactNode | null;
}) {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "bg-white/60 backdrop-blur-sm p-6 px-4 flex flex-col rounded-lg shadow-lg m-auto",
        { "w-[calc(100dvw-20px)]": !fitContainer },
      )}
    >
      <div className="flex flex-col flex-grow-0 items-center justify-center">
        <div>
          <h1 className="text-4xl font-bold text-center">
            {quizResultHeadline ?? t("quiz.result.defaultHeadline")}
          </h1>

          <div
            className="mt-4 text-gray-600 text-center"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                descriptionHtml ?? t("quiz.result.defaultDescription"),
              ),
            }}
          />
        </div>
      </div>
      <div className="flex flex-col flex-1 flex-grow">{children ?? null}</div>
    </div>
  );
});
