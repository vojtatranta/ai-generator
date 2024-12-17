"use client";
import { Icons } from "@/components/icons";
import PageContainer from "@/components/layout/page-container";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RANDOM_TOPICS, UsedPromptType } from "@/constants/data";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import {
  InvokeOutput,
  PromptResultHistory,
  RenderResultType,
  ResultType,
} from "./PromptResultHistory";

const DEFAULT_LENGTH = 200;

const QueryFormSchema = z.object({
  message: z.string(),
  length: z.number().default(DEFAULT_LENGTH),
  locale: z.string(),
});

type QueryFormType = z.infer<typeof QueryFormSchema>;

const getPromptResultData = (result: InvokeOutput | null) => {
  return (
    result?.choices?.map((choice) => choice.message.content).join("") ?? null
  );
};

const getDefaultValues = (
  t: (key: string) => string,
  randomNumberFromTopics: number,
  prompt: UsedPromptType,
  locale: string,
): QueryFormType => {
  return {
    message: RANDOM_TOPICS(t)[randomNumberFromTopics] ?? "",
    length: prompt.defaultLength ?? DEFAULT_LENGTH,
    locale,
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
  const locale = useLocale();
  const [promptResults, setPromptResults] = useState<ResultType[]>([]);
  const form = useForm<QueryFormType>({
    resolver: zodResolver(QueryFormSchema),
    defaultValues: getDefaultValues(t, randomNumberFromTopics, prompt, locale),
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
      { id: uuidv4(), prompt: data.message, result: null },
    ]);
    // await invokeQuery.refetch();
    invokeMutation.mutateAsync({
      prompt: prompt.prompt,
      message: data.message,
      locale: data.locale,
      length: Number(data.length || DEFAULT_LENGTH),
    });
  };

  const allResults: RenderResultType[] = [
    ...[...promptResults]
      .reverse()
      .filter((result) => result.result)
      .map((result) => ({
        id: result.id,
        aiResponse: result.result as InvokeOutput,
        prompt: result.prompt ?? "",
        aiResult: null,
      })),
    ...aiResults.map((result) => ({
      id: result.uuid,
      aiResponse: result.ai_result as InvokeOutput,
      prompt: result.prompt ?? "",
      aiResult: result,
    })),
  ];

  const lastPromptResult = Maybe.fromLast(
    promptResults.filter(
      (
        result,
      ): result is ResultType & {
        result: InvokeOutput;
      } => Boolean(result.result),
    ),
  )
    .andThen((result: ResultType) => getPromptResultData(result.result))
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
                                className="max-w-[150px]"
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
                      <FormField
                        control={form.control}
                        name="locale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("prompt.locale")}</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                className="max-w-[150px]"
                                placeholder={t("prompt.localePlaceholder")}
                                {...field}
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
          <PromptResultHistory
            allResults={allResults}
            renderResult={(result: RenderResultType) => (
              <div>
                <div
                  key={`${result.aiResponse.id}`}
                  className="flex items-center space-x-2"
                >
                  <CopyableText
                    copyValue={getPromptResultData(result.aiResponse) ?? ""}
                    className="w-full flex-1"
                  >
                    {getPromptResultData(result.aiResponse)}
                  </CopyableText>
                </div>
              </div>
            )}
          />
        </form>
      </Form>
    </PageContainer>
  );
});
