"use client";
import { Icons } from "@/components/icons";
import PageContainer from "@/components/layout/page-container";
import { RouterOutput, trpcApi } from "@/components/providers/TRPCProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PROMPTS, PROMPTS_UNION } from "@/constants/data";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
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

const DEFAULT_LENGTH = 200;

const QueryFormSchema = z.object({
  message: z.string(),
  length: z.number().default(DEFAULT_LENGTH),
});

type QueryFormType = z.infer<typeof QueryFormSchema>;

const getPromptResultData = (
  result: RouterOutput["langtail"]["invokePrompt"],
) => {
  return result.choices.map((choice) => choice.message.content).join("");
};

const RANDOM_TOPICS = (t: (key: string) => string) => [
  t("prompt.randomTopic.POLITICS"),
  t("prompt.randomTopic.LOCAL_SINGER"),
  t("prompt.randomTopic.LOCAL_ACTOR"),
  t("prompt.randomTopic.LOCAL_ACTRESS"),
  t("prompt.randomTopic.LOCAL_MUSICIAN"),
  t("prompt.randomTopic.LOCAL_CHEF"),
  t("prompt.randomTopic.LOCAL_CHEF"),
  t("prompt.randomTopic.LOCAL_WRITER"),
  t("prompt.randomTopic.LOCAL_AUTHOR"),
];

const getDefaultValues = (t: (key: string) => string): QueryFormType => {
  return {
    message:
      RANDOM_TOPICS(t)[Math.floor(Math.random() * RANDOM_TOPICS(t).length)] ??
      "",
    length: DEFAULT_LENGTH,
  };
};

export const PromptQueryPage = memo(function PromptQueryPage({
  promptSlug,
}: {
  promptSlug: PROMPTS_UNION;
}) {
  const t = useTranslations();
  const [promptResult, setPromptResult] = useState<string>("");
  const form = useForm<QueryFormType>({
    resolver: zodResolver(QueryFormSchema),
    defaultValues: getDefaultValues(t),
  });

  const invokeMutation = trpcApi.langtail.invokePrompt.useMutation({
    onSuccess: (data) => {
      setPromptResult(getPromptResultData(data));
      toast.success(t("prompt.success"));
    },
  });

  const onSubmit = async (data: QueryFormType) => {
    // await invokeQuery.refetch();
    invokeMutation.mutateAsync({
      prompt: promptSlug,
      message: data.message,
      length: Number(data.length || DEFAULT_LENGTH),
    });
  };

  return (
    <PageContainer scrollable>
      <Card className="mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-left text-2xl font-bold">
            {t("prompt.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full space-y-2"
              >
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("prompt.message")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("prompt.message")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("prompt.length")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("prompt.length")}
                          {...field}
                          value={field.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      type="submit"
                      className={cn("flex items-center space-x-2", {
                        "opacity-50 cursor-not-allowed":
                          form.formState.isSubmitting,
                      })}
                      disabled={
                        form.formState.isSubmitting || invokeMutation.isLoading
                      }
                    >
                      {invokeMutation.isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Icons.wandSparkles className="h-4 w-4 mr-2" />
                      )}
                      {t("prompt.run")}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
            <div className="mt-4">
              <div className="flex items-center space-x-2"></div>
              <div className="mt-2">
                <Textarea
                  value={promptResult}
                  placeholder={t("prompt.result")}
                  className="min-h-[200px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
});
