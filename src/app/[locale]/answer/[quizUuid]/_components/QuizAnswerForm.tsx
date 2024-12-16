"use client";

import { Button } from "@/components/ui/button";
import {
  answerFormStateSchema,
  getEmailAnswerFormSchema,
  AnswerFormState,
  quizQuestionSchema,
  QUESTION_TYPES_MAP,
} from "@/lib/parsers";
import { Quiz } from "@/lib/supabase-server";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Maybe } from "actual-maybe";
import z from "zod";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QuizAnswerHeader } from "./QuizAnswerHeader";

const getPossibleQuestionIndex = (
  questionIndex: number,
  questions: z.infer<typeof quizQuestionSchema>,
) => {
  if (questionIndex <= 0) return 0;
  if (questionIndex > questions.length) return questions.length;
  return questionIndex;
};

const updateAnswerState = (
  answerFormState: AnswerFormState,
  questionId: string,
  answerUpdater: (
    currentState: AnswerFormState["answers"][number],
  ) => Partial<AnswerFormState["answers"][number]>,
) => {
  const nextQuestion = {
    ...(answerFormState.answers[questionId] || {}),
    questionId,
  };
  const updatedQuestion = answerUpdater(nextQuestion);
  const answerUpdate = {
    ...nextQuestion,
    ...updatedQuestion,
  };

  return answerFormStateSchema.parse({
    ...answerFormState,
    answers: {
      ...answerFormState.answers,
      [questionId]: answerUpdate,
    },
  });
};

export default function QuizAnswerForm({
  defaultIndex,
  quiz,
  testMode,
}: {
  defaultIndex: number;
  quiz: Quiz;
  testMode: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);

  const form = useForm({
    resolver: zodResolver(getEmailAnswerFormSchema(t)),
    defaultValues: {
      email: "",
    },
  });
  const questions = quizQuestionSchema.parse(quiz.questions);
  const possibleQuestionIndex = getPossibleQuestionIndex(
    defaultIndex,
    questions,
  );
  const { mutate, isLoading } = trpcApi.quizAnswers.finish.useMutation({
    onSuccess: async ({ quizResultUuid }) => {
      toast.success(t("quiz.answer.successMessage"));
      await router.push(`/answer/${quiz.uuid}/result/${quizResultUuid}`);
      // setAnswerFormState({ answers: {} });
      // performQuestionChange(0);
    },
  });

  const [answerFormState, setAnswerFormState] = useState<AnswerFormState>({
    answers: {},
  });
  const [questionIndex, _setQuestionIndex] = useState<{ question: number }>(
    () => ({
      question: possibleQuestionIndex,
    }),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (quiz.gather_email) {
      handleFinishWithValidation();
      return;
    }
    handleFinish();
  };

  const handleFinish = () => {
    setFinishing(true);
    const values = form.getValues();
    mutate({
      clientEmail: values.email || null,
      quizUuid: quiz.uuid,
      answers: answerFormState,
      testMode,
    });
  };

  const handleFinishWithValidation = form.handleSubmit(() => {
    handleFinish();
  });

  const markQuestionAnswer = (
    questionId: string,
    optionId: string,
    options: {
      isMultiple: boolean;
    },
  ) => {
    const nextState = updateAnswerState(
      answerFormState,
      questionId,
      (currentQuestion) => ({
        selectedOptionIds: (() => {
          const currentSelectedOptionIds = new Set(
            options.isMultiple ? (currentQuestion.selectedOptionIds ?? []) : [],
          );

          if (currentSelectedOptionIds.has(optionId)) {
            currentSelectedOptionIds.delete(optionId);
          } else {
            currentSelectedOptionIds.add(optionId);
          }

          return Array.from(currentSelectedOptionIds);
        })(),
      }),
    );

    setAnswerFormState(nextState);
  };

  const goToFinishPage = () => {
    // NOTE: go there without changing the hash, that's nonexistene index
    _setQuestionIndex({ question: questions.length });
  };

  const performQuestionChange = (question: number) => {
    if (question === 0) {
      _setQuestionIndex({ question: 0 });
      return;
    }

    _setQuestionIndex({ question });
  };

  const maybeQuestion = Maybe.of(questions[questionIndex.question]);

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-[700px] min-w-[480px]">
      <QuizAnswerHeader
        quizName={quiz.name}
        quizDescription={quiz.description}
      />
      <div className="mt-4">
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            {maybeQuestion
              .map((q) => (
                <div
                  key={q.id}
                  className="mb-4 p-4 min-w-[400px] bg-white/70 rounded-lg shadow"
                >
                  <div className="text-gray-600">{q.name}</div>
                  <div className="text-sm text-gray-400">{q.description}</div>
                  <div className="text-sm mt-1 gap-1 flex flex-col">
                    {q.options
                      .filter((o) => o.text)
                      .map((o) => (
                        <div
                          key={o.id}
                          className={cn(
                            "px-2 py-1 bg-gray-100 border cursor-pointer border-gray-200 rounded-md flex items-center gap-2",
                            answerFormState.answers[
                              q.id
                            ]?.selectedOptionIds?.includes(o.id) &&
                              "bg-emerald-500 text-white",
                          )}
                          onClick={() => {
                            markQuestionAnswer(q.id, o.id, {
                              isMultiple:
                                q.type === QUESTION_TYPES_MAP.multiple,
                            });
                          }}
                        >
                          <div
                            className={cn(
                              "px-2 py-1 bg-gray-100 border border-gray-200 rounded-md",
                              answerFormState.answers[
                                q.id
                              ]?.selectedOptionIds?.includes(o.id) &&
                                "bg-emerald-500 text-white",
                            )}
                          >
                            {o.optionKey}
                          </div>
                          {o.text}
                        </div>
                      ))}
                  </div>
                </div>
              ))
              .getValue(
                <div className="flex justify-center flex-col gap-2 mt-4">
                  <>
                    <div>{t("quiz.answer.gatherEmailDescription")}</div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quiz.answer.emailLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("quiz.answer.emailPlaceholder")}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>

                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      className="w-full"
                      variant="default"
                      size="lg"
                      type="submit"
                      disabled={isLoading || finishing}
                    >
                      {(isLoading || finishing) && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {t("quiz.answer.finishQuiz")}
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAnswerFormState({
                          answers: {},
                        });
                        performQuestionChange(0);
                      }}
                    >
                      {t("quiz.answer.startOver")}
                    </Button>
                  </div>
                </div>,
              )}
          </form>
        </Form>
      </div>
      <div className="flex flex-row items-center justify-between mt-4">
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            disabled={questionIndex.question <= 0}
            onClick={() => performQuestionChange(questionIndex.question - 1)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("quiz.answer.previousQuestion")}
          </Button>

          <Button
            variant="outline"
            disabled={questionIndex.question > questions.length - 1}
            onClick={() => performQuestionChange(questionIndex.question + 1)}
            className="ml-auto"
          >
            {t("quiz.answer.nextQuestion")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div>
          {questionIndex.question !== questions.length && (
            <Button onClick={goToFinishPage} className="ml-auto">
              {t("quiz.answer.goToFinish")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
