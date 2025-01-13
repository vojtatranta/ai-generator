"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Book, MessageSquare, Bot } from "lucide-react";

import { Icons } from "@/components/icons";
import PageContainer from "@/components/layout/page-container";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RAG_QUERY_IMPROVER, UsedPromptType } from "@/constants/data";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { memo } from "react";
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
import { Maybe } from "actual-maybe";
import { AIResult } from "@/lib/supabase-server";
import { InvokeOutput, ResultType } from "./PromptResultHistory";
import { SelectedFilesDisplay } from "@/src/components/SelectedFilesDisplay";
import { MemoizedLangtailMarkdownBlock } from "@/components/Markdown";
import type uploadFileAction from "@/lib/upload-file-action";
import { DocumentFileList } from "./DocumentFileList";

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
    message: "",
    length: prompt.defaultLength ?? DEFAULT_LENGTH,
    locale,
  };
};

export const PromptDocumentPage = memo(function PromptDocumentPage({
  aiResults,
  prompt,
  onUploadFileAction,
  randomNumberFromTopics = 0,
}: {
  aiResults: AIResult[];
  prompt: UsedPromptType;
  randomNumberFromTopics: number;
  onUploadFileAction: (
    formData: FormData,
  ) => ReturnType<typeof uploadFileAction>;
}) {
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const t = useTranslations();
  const locale = useLocale();
  const [promptResults, setPromptResults] = useState<ResultType[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState<boolean>(false);
  const firstSelected = useRef<boolean>(false);
  const form = useForm<QueryFormType>({
    resolver: zodResolver(QueryFormSchema),
    defaultValues: getDefaultValues(t, randomNumberFromTopics, prompt, locale),
  });
  const {
    data: fileList,
    isInitialLoading: filesLoading,
    refetch: refetchFiles,
  } = trpcApi.filesRouter.listFiles.useQuery();
  const utils = trpcApi.useUtils();

  useEffect(() => {
    if (
      selectedFiles.size === 0 &&
      fileList &&
      fileList.length > 0 &&
      !firstSelected.current
    ) {
      firstSelected.current = true;
      Maybe.of(fileList?.at(-1)).andThen((file) =>
        setSelectedFiles(new Set([file.id])),
      );
    }
  }, [fileList, selectedFiles.size]);

  const uploadTextFileMutation = trpcApi.filesRouter.uploadText.useMutation({
    onSuccess: ({ addedFile }) => {
      utils.filesRouter.listFiles.invalidate();
      setSelectedFiles(new Set([addedFile.id]));
      toast.success(t("prompt.uploadTextSuccess"));
    },
  });

  const improveRagMutation = trpcApi.langtail.invokePrompt.useMutation();

  const invokeMutation = trpcApi.langtail.askDocument.useMutation({
    onSuccess: (data) => {
      setPromptResults((prev) => {
        const last = prev[prev.length - 1];

        return [...prev, { ...(last ?? {}), result: data }];
      });
      toast.success(t("prompt.askDocumentSuccess"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const askMessage = form.watch("message");

  const onSubmit = async (data: QueryFormType) => {
    setPromptResults((prev) => [
      ...prev,
      { id: uuidv4(), prompt: data.message, result: null },
    ]);

    const improvedMessageResult = await improveRagMutation.mutateAsync({
      prompt: RAG_QUERY_IMPROVER,
      message: data.message,
      locale: data.locale,
      length: Number(data.length || DEFAULT_LENGTH),
      stream: false,
    });

    // await invokeQuery.refetch();
    invokeMutation.mutateAsync({
      message:
        improvedMessageResult.choices?.[0]?.message.content ?? data.message,
      locale: data.locale,
      filename:
        fileList
          ?.filter((f) => selectedFiles.has(f.id))
          .map((f) => f.filename)
          .join(",") ?? "",
      length: Number(data.length || DEFAULT_LENGTH),
      fileIds: Array.from(selectedFiles.values()),
    });
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        <Card className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    {t("prompt.askAQuestionAboutTheDocument")}
                  </div>
                  <SelectedFilesDisplay
                    selectedFiles={selectedFiles}
                    fileList={fileList ?? []}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor={field.name}>
                        {t("prompt.addQuestionAboutTheDocuemntLabel")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px]"
                          disabled={selectedFiles.size === 0}
                          placeholder={
                            selectedFiles.size === 0
                              ? t(
                                  "prompt.documentChatNoFileSelectedPlaceholder",
                                )
                              : t(
                                  "prompt.addQuestionAboutTheDocuemntPlaceholder",
                                )
                          }
                          {...field}
                          id={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  variant="primary"
                  type="submit"
                  className={cn("flex items-center space-x-2", {
                    "opacity-50 cursor-not-allowed text-nowrap":
                      form.formState.isSubmitting,
                  })}
                  disabled={
                    form.formState.isSubmitting ||
                    invokeMutation.isLoading ||
                    improveRagMutation.isLoading ||
                    selectedFiles.size === 0 ||
                    !askMessage
                  }
                >
                  {invokeMutation.isLoading || improveRagMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icons.wandSparkles className="h-4 w-4 mr-2" />
                  )}
                  {t("prompt.askDocumentSubmitButtonTitle")}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Book className="w-5 h-5 mr-2" />
              {t("prompt.documentChatDocumentList")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentFileList
              fileList={fileList ?? null}
              filesLoading={filesLoading}
              selectedFiles={selectedFiles}
              onSelectedFilesChange={setSelectedFiles}
              onRefetch={refetchFiles}
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                {t("prompt.aiResponseFromWithTheDocumentContextTitle")}
              </div>

              <SelectedFilesDisplay
                selectedFiles={selectedFiles}
                fileList={fileList ?? []}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] w-full rounded-md border p-4">
              {lastPromptResult ? (
                <p className="text-sm">
                  <MemoizedLangtailMarkdownBlock>
                    {lastPromptResult}
                  </MemoizedLangtailMarkdownBlock>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("prompt.noDocumentChatAnswerYet")}
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Upload className="w-5 h-5 mr-2" />
              {t("prompt.uploadDocument")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label
                htmlFor="file-upload"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("prompt.uploadDocument")}
              </Label>
              <div className="mt-1 flex">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf"
                  onChange={(input) => {
                    Maybe.fromFirst(
                      Array.from(input.currentTarget.files ?? []),
                    ).map(async (file) => {
                      setFileToUpload(file);
                      const formData = new FormData();
                      console.log("file", file);
                      formData.append("file", file);
                      formData.append("name", file.name);

                      try {
                        setFileUploading(true);
                        const result = await onUploadFileAction(formData);
                        console.log("result", result);

                        if (!result) {
                          setFileToUpload(null);
                          setFileUploading(false);
                          toast.error(
                            t("prompt.cantGenerateImagePostTryAgain"),
                          );
                          return;
                        }

                        await utils.filesRouter.listFiles.invalidate();
                        setFileUploading(false);
                        setFileToUpload(null);
                        setSelectedFiles(new Set([result.addedFile.id]));
                        toast.success(t("prompt.fileUploadSuccess"));
                      } catch (error) {
                        console.log("fiel upload error", error);
                        setFileToUpload(null);
                        setFileUploading(false);
                        toast.error(
                          t("prompt.cantGenerateImagePostTryAgain", {
                            error:
                              error instanceof Error
                                ? error.message
                                : String(error),
                          }),
                        );
                      }
                    });
                  }}
                  className="sr-only"
                />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-background flex flex-row items-center py-2 px-3 border rounded-l-md shadow-sm text-sm font-medium text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {fileUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2 inline-block" />
                  )}
                  {t("prompt.uploadFileInputLabel")}
                </Label>
                <span className="flex-1 bg-background py-2 px-3 text-sm border border-l-0 rounded-r-md">
                  {fileToUpload
                    ? fileToUpload.name
                    : t("prompt.noFileSelected")}
                </span>
              </div>
            </div>
            <form
              onSubmit={(form) => {
                form.preventDefault();
                Maybe.of(new FormData(form.currentTarget).get("text")).map(
                  (text) =>
                    uploadTextFileMutation.mutateAsync({
                      text: String(text),
                      name: String(text).trim().slice(0, 50) + "...",
                    }),
                );
              }}
            >
              <Label
                htmlFor="text-upload"
                className="text-sm font-medium text-gray-700"
              >
                {t("prompt.orPasteLargeText")}
              </Label>
              <Textarea
                id="text-upload"
                name="text"
                placeholder={t("prompt.uploadTextPlaceholder")}
                className="mt-1"
              />
              <Button
                disabled={uploadTextFileMutation.isLoading}
                type="submit"
                variant="outline"
                className="mt-2 w-full"
              >
                {uploadTextFileMutation.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {t("prompt.uploadText")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
});
