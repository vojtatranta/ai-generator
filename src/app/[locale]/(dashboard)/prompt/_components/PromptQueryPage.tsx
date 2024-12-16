"use client";
import { Icons } from "@/components/icons";
import PageContainer from "@/components/layout/page-container";
import { RouterOutput, trpcApi } from "@/components/providers/TRPCProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  PROMPTS,
  PROMPTS_UNION,
  RANDOM_TOPICS,
  UsedPromptType,
} from "@/constants/data";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { memo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/web/components/ui/form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Maybe } from "actual-maybe";
import { CopyableText } from "@/components/CopyableText";
import { CopyButton } from "@/components/CopyButton";
import { AIResult } from "@/lib/supabase-server";

const DEFAULT_LENGTH = 200;

const QueryFormSchema = z.object({
  message: z.string(),
  length: z.number().default(DEFAULT_LENGTH),
});

type QueryFormType = z.infer<typeof QueryFormSchema>;
type InvokeOutput = RouterOutput["langtail"]["invokePrompt"];
type StateType = {
  result: InvokeOutput | null;
  prompt: string;
};

const getPromptResultData = (result: InvokeOutput | null) => {
  return (
    result?.choices?.map((choice) => choice.message.content).join("") ?? null
  );
};

const getDefaultValues = (
  t: (key: string) => string,
  randomNumberFromTopics: number,
  prompt: UsedPromptType,
): QueryFormType => {
  return {
    message: RANDOM_TOPICS(t)[randomNumberFromTopics] ?? "",
    length: prompt.defaultLength ?? DEFAULT_LENGTH,
  };
};

export const PromptQueryPage = memo(function PromptQueryPage({
  aiResults,
  prompt,
  randomNumberFromTopics = 0,
}: {
  aiResults: AIResult[];
  prompt: UsedPromptType;
  randomNumberFromTopics: number;
}) {
  const t = useTranslations();
  const [promptResults, setPromptResults] = useState<StateType[]>([]);
  const form = useForm<QueryFormType>({
    resolver: zodResolver(QueryFormSchema),
    defaultValues: getDefaultValues(t, randomNumberFromTopics, prompt),
  });

  const invokeMutation = trpcApi.langtail.invokePrompt.useMutation({
    onSuccess: (data) => {
      setPromptResults((prev) => {
        const last = prev[prev.length - 1];

        return [...prev, { ...(last ?? {}), result: data }];
      });
      toast.success(t("prompt.success"));
    },
  });

  const onSubmit = async (data: QueryFormType) => {
    setPromptResults((prev) => [
      ...prev,
      { prompt: data.message, result: null },
    ]);
    // await invokeQuery.refetch();
    invokeMutation.mutateAsync({
      prompt: prompt.prompt,
      message: data.message,
      length: Number(data.length || DEFAULT_LENGTH),
    });
  };

  const allResults = [
    ...promptResults.reverse().filter((result) => result.result),
    ...aiResults.map((result) => ({
      result: result.ai_result as InvokeOutput,
      prompt: result.prompt ?? "",
    })),
  ];

  const lastPromptResult = Maybe.fromLast(
    promptResults.filter(
      (
        result,
      ): result is StateType & {
        result: InvokeOutput;
      } => Boolean(result.result),
    ),
  )
    .andThen((result: StateType) => getPromptResultData(result.result))
    .getValue("");

  return (
    <PageContainer>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_auto] gap-4"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-left text-2xl font-bold">
                {t(prompt.title)}
              </CardTitle>
              <CardDescription className="max-w-[500px]">
                {t(prompt.description)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full space-y-2">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("prompt.message")}</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[175px]"
                            placeholder={t("prompt.message")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <div className="flex items-end justify-between">
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("prompt.resultLength")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t(
                                  "prompt.resultLengthPlaceholder",
                                )}
                                {...field}
                                value={field.value}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        variant="primary"
                        type="submit"
                        className={cn("flex items-center space-x-2", {
                          "opacity-50 cursor-not-allowed":
                            form.formState.isSubmitting,
                        })}
                        disabled={
                          form.formState.isSubmitting ||
                          invokeMutation.isLoading
                        }
                      >
                        {invokeMutation.isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Icons.wandSparkles className="h-4 w-4 mr-2" />
                        )}
                        {t("prompt.generateUsingAi")}
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="length"
                    render={() => (
                      <FormItem>
                        <div className="flex flex-row  justify-between items-center">
                          <FormLabel>{t("prompt.result")}</FormLabel>
                          <CopyButton
                            className="ml-2 max-h-[23px]"
                            variant="outline"
                            size="xs"
                            value={lastPromptResult}
                          />
                        </div>
                        <FormControl>
                          <Textarea
                            defaultValue={lastPromptResult}
                            placeholder={t("prompt.result")}
                            className="min-h-[250px]"
                            onClick={(
                              event: React.MouseEvent<HTMLTextAreaElement>,
                            ) =>
                              Maybe.fromLast(
                                promptResults.filter((result) => result.result),
                              ).andThen(async (result) => {
                                try {
                                  await navigator.clipboard.writeText(
                                    getPromptResultData(result) ?? "",
                                  );
                                  toast.success(t("prompt.resultCopied"));
                                } catch (error) {
                                  toast.error(`
                                  ${t("prompt.resultCopyFailed")}, ${String(error)}`);
                                }
                              })
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="max-w-[500px]">
            <CardContent className="py-6">
              {Maybe.fromFirst(allResults)
                .andThen(() => (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">
                      {t("prompt.olderResults")}
                    </div>

                    {allResults.map((result, index) => (
                      <div
                        key={`${result}-${index}`}
                        className="flex items-center space-x-2"
                      >
                        <div>
                          <div className="flex items-center justify-center w-6 h-6 mr-2 bg-primary-foreground text-primary rounded-full">
                            {index + 1}
                          </div>
                          {Maybe.of(result.prompt)
                            .andThen((userPrompt) => (
                              <span className="text-sm text-gray-400">
                                {userPrompt}
                              </span>
                            ))
                            .orNull()}
                          <CopyableText
                            copyValue={getPromptResultData(result.result) ?? ""}
                            className="w-full flex-1"
                          >
                            {getPromptResultData(result.result)}
                          </CopyableText>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
                .getValue(
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-center text-sm text-gray-500">
                      {t("prompt.postGenerationResultsEmptyStateText")}
                    </div>
                  </div>,
                )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </PageContainer>
  );
});
