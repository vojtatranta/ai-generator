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
import Resizer from "react-image-file-resizer";
import {
  PROMPTS,
  PROMPTS_UNION,
  RANDOM_IMAGE_TOPICS,
  RANDOM_TOPICS,
  UsedPromptType,
} from "@/constants/data";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Loader2, Plus } from "lucide-react";
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
import { FileInput } from "@/components/ui/fileinput";
import { OutputIframe } from "./OutputIframe";
import { AIResult } from "@/lib/supabase-server";
import { useRouter } from "next/navigation";

const DEFAULT_LENGTH = 200;

const QueryFormSchema = z.object({
  message: z.string(),
  image: z.string().nullable().optional(),
  length: z.number().default(DEFAULT_LENGTH),
  locale: z.string(),
});

type QueryFormType = z.infer<typeof QueryFormSchema>;

type InvokeOutput = RouterOutput["langtail"]["invokePrompt"];

type ResultType = {
  prompt: string;
  result: InvokeOutput | null;
};

const parseImageFromResponseText = (text: string | null | undefined) => {
  /// result <iframe><img src="https://replicate.delivery/xezq/5StDOTFr3v4NGFWZL77PAZ4tkEZBqlPpo2MVeZ9G9ppc8u9JA/out-0.jpg" width="250"/></iframe>
  const match = text?.match(/<iframe.*?src="([^"]*)".*?<\/iframe>/);
  if (match) {
    return match;
  }
  return null;
};

const getDefaultValues = (
  t: (key: string) => string,
  randomNumberFromTopics: number,
  prompt: UsedPromptType,
  locale: string,
): QueryFormType => {
  return {
    message: RANDOM_IMAGE_TOPICS(t)[randomNumberFromTopics] ?? "",
    length: prompt.defaultLength ?? DEFAULT_LENGTH,
    locale,
    image: null,
  };
};

const renderResult = (result: ResultType) => {
  return (
    result.result?.choices.flatMap((choice, choiceIndex) => {
      return (
        <div key={`${choice.index}`} className="flex flex-col items-center">
          {Maybe.of(parseImageFromResponseText(choice.message.content))
            .andThen((match) => {
              return (
                <div>
                  <div className="rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={match[1]} className="max-w-full" />
                  </div>
                  {choice.message.content?.replaceAll(match[0], "")}
                </div>
              );
            })
            .getValue(
              <CopyableText className="text-center max-w-full">
                {choice.message.content}
              </CopyableText>,
            )}
        </div>
      );
    }) ?? null
  );
};

export const PromptImageQueryPage = memo(function PromptQueryPage({
  aiResults,
  prompt,
  randomNumberFromImageTopics = 0,
}: {
  aiResults: AIResult[];
  prompt: UsedPromptType;
  randomNumberFromImageTopics: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [promptResults, setPromptResults] = useState<ResultType[]>([]);
  const form = useForm<QueryFormType>({
    resolver: zodResolver(QueryFormSchema),
    defaultValues: getDefaultValues(
      t,
      randomNumberFromImageTopics,
      prompt,
      locale,
    ),
  });

  const invokeMutation = trpcApi.langtail.invokePrompt.useMutation({
    onSuccess: (data) => {
      setPromptResults((prev) => {
        const last = prev[prev.length - 1];

        return [...prev.slice(-1), { ...last, result: data }];
      });
      toast.success(t("prompt.success"));
    },
  });

  const onSubmit = async (data: QueryFormType) => {
    // await invokeQuery.refetch();
    setPromptResults((prev) => [
      ...prev,
      { prompt: data.message, result: null },
    ]);
    await invokeMutation.mutateAsync({
      prompt: prompt.prompt,
      message: data.message,
      locale: data.locale,
      image: data.image ?? undefined,
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
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("prompt.image")}</FormLabel>
                        <FileInput
                          placeholder={t("image.placeholder")}
                          {...field}
                          currentImageUrl={field.value ?? ""}
                          onFileSelect={(maybeFile, base64) => {
                            Maybe.of(maybeFile).andThen((file) => {
                              Resizer.imageFileResizer(
                                file,
                                1024,
                                1024,
                                "JPEG",
                                70,
                                0,
                                (uri) => {
                                  field.onChange(uri);
                                },
                              );
                            });
                          }}
                        >
                          <Input
                            placeholder={t("image.urlPlaceholder")}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                          />
                        </FileInput>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            value={Maybe.fromFirst(
                              promptResults.filter((result) => result.result),
                            )
                              .andThen((lastResult) =>
                                String(lastResult.result),
                              )
                              .getValue("")}
                          />
                        </div>
                        <div>
                          {Maybe.fromFirst(
                            promptResults.filter((result) => result.result),
                          )
                            .andThen((lastResult) => (
                              <div>{renderResult(lastResult)}</div>
                            ))
                            .getValue(
                              <div className="flex flex-col items-center justify-center">
                                <div className="text-center text-sm text-gray-500">
                                  {t(
                                    "prompt.postGenerationResultsEmptyStateText",
                                  )}
                                </div>
                              </div>,
                            )}
                        </div>
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
                        key={`${index}-${result.prompt}`}
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

                          {renderResult(result)}
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
