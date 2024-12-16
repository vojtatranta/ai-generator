import { memo } from "react";
import { useFormContext } from "react-hook-form";
import { type QuizFormType } from "./quiz-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuizAnswerHeader } from "../../../answer/[quizUuid]/_components/QuizAnswerHeader";
import { QuizResultContainer } from "../../../answer/[quizUuid]/_components/QuizResultContainer";
import { Else, If, Then } from "@/components/ui/condition";

export enum FormTabs {
  FORM = "form",
  RESULT = "result",
}

export const QuizFormPreview = memo(function QuizFormPreview({
  displayedQuestionIndex,
  t,
  tab,
  onDisplayedQuestionIndex,
}: {
  displayedQuestionIndex: number;
  t: (key: string) => string;
  tab: FormTabs;
  onDisplayedQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const form = useFormContext<QuizFormType>();

  return (
    <div className="flex pt-4 h-full flex-col justify-between -mr-2">
      <div
        className="flex-1 w-full rounded-lg bg-cover bg-center bg-gray-100 border border-gray-200"
        style={{
          backgroundImage: `url(${form.watch("backgroundImage")})`,
        }}
      >
        <div className="flex flex-col h-full p-6 justify-center items-center">
          <If condition={tab === FormTabs.FORM}>
            <Then>
              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-[700px] min-w-[480px]">
                <QuizAnswerHeader
                  quizName={form.watch("name")}
                  quizDescription={form.watch("description")}
                />
                <div className="flex flex-col h-full p-6 justify-center items-center">
                  {[form.watch(`questions.${displayedQuestionIndex}`)]
                    .filter(Boolean)
                    .map((question) => (
                      <div
                        key={question.id}
                        className="mb-4 p-4 min-w-[400px] bg-white/90 rounded-lg shadow"
                      >
                        <div className="text-gray-600">{question.name}</div>
                        <div className="text-sm text-gray-400">
                          {question.description}
                        </div>
                        <div className="text-sm mt-1 gap-1 flex flex-col">
                          {question.options
                            .filter((o) => o.text)
                            .map((o) => (
                              <div
                                key={o.id}
                                className={cn(
                                  "px-2 py-1 bg-gray-100 border border-gray-200 rounded-md flex items-center gap-2",
                                )}
                              >
                                <div className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md">
                                  {o.optionKey}
                                </div>
                                {o.text}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </Then>
            <Else>
              <div className="flex flex-col h-full p-6 justify-center items-center">
                <QuizResultContainer
                  fitContainer
                  descriptionHtml={form.watch("quizResultDescription") ?? null}
                  quizResultHeadline={form.watch("quizResultHeadline") ?? null}
                />
              </div>
            </Else>
          </If>
        </div>
      </div>
      <If condition={tab === FormTabs.FORM}>
        <Then>
          <div className="flex justify-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={displayedQuestionIndex === 0}
              onClick={() => onDisplayedQuestionIndex((prev) => prev - 1)}
            >
              {t("navigation.previous")}
            </Button>
            <div className="flex items-center">
              {t("questions.Question")} {displayedQuestionIndex + 1}{" "}
              {t("questions.of")} {form.watch("questions")?.length || 0}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                displayedQuestionIndex ===
                  form.watch("questions")?.length - 1 ||
                !form.watch("questions")?.length
              }
              onClick={() => onDisplayedQuestionIndex((prev) => prev + 1)}
            >
              {t("navigation.next")}
            </Button>
          </div>
        </Then>
      </If>
    </div>
  );
});
