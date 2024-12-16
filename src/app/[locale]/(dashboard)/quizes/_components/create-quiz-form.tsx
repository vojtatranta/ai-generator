"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/web/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/web/components/ui/form";
import { Card, CardTitle, CardContent } from "@/web/components/ui/card";
import Link from "next/link";
import { Quiz, User } from "@/web/lib/supabase-server";
import { CopyableText } from "@/web/components/CopyableText";
import { useState } from "react";
import {
  useInsertMutation,
  useUpdateMutation,
} from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { toast } from "sonner";
import { quizFormSchema, QuizFormType, quizToForm } from "./quiz-form";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { getDevAnswerLink, getProductionAnswerLink } from "@/lib/public-links";
import { useTranslations } from "next-intl";
import { FormTabs, QuizFormPreview } from "./quiz-form-preview";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useRouter } from "next/navigation";
import { Maybe } from "actual-maybe";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/web/components/ui/tabs";
import { QuizBasicInfoSection } from "./QuizBasicInfoSection";
import { QuizQuestionsSection } from "./QuizQuestionsSection";
import { QuizResultSection } from "./QuizResultSection";
import { If, Then } from "@/components/ui/condition";

export default function CreateQuizForm({
  user,
  quiz,
}: {
  user: User;
  quiz?: Quiz;
}) {
  const t = useTranslations("quiz.create");
  const router = useRouter();
  const supabase = useSupabase();
  const [displayedQuestionIndex, setDisplayedQuestionIndex] = useState(0);
  const [tab, setTab] = useState<FormTabs>(FormTabs.FORM);

  const insertMutation = useInsertMutation(
    supabase.from("quizes"),
    ["id"],
    "*",
    {
      onSuccess: async (addedEntities) => {
        Maybe.fromFirst(addedEntities).map((entity) => {
          toast.success(t("quizCreated"));
          form.reset(quizToForm(entity));
          router.push(`/quizes/${entity.id}`);
        });
      },
      onError: (error) => {
        toast.error(`${t("somethingWentWrong")}: ${error.message}`);
      },
    },
  );

  const updateMutation = useUpdateMutation(
    supabase.from("quizes"),
    ["id"],
    "*",
    {
      onSuccess: async (_, updatedEntity) => {
        toast.success(t("quizUpdated"));
        form.reset(quizToForm(updatedEntity));
      },
      onError: (error) => {
        toast.error(`${t("somethingWentWrong")}: ${error.message}`);
      },
    },
  );

  const form = useForm<QuizFormType>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: quizToForm(quiz),
  });

  function onSubmit(values: QuizFormType) {
    if (quiz) {
      updateMutation.mutate({
        id: quiz.id,
        name: values.name,
        user: user.id,
        published: values.published,
        gather_email: values.gatherEmail,
        description: values.description,
        max_number_of_products_to_display: values.maxNumberOfProducts,
        background_image_url: values.backgroundImage,
        questions: values.questions,
        result_page_slots: values.resultPageSlots,
        quiz_result_headline: values.quizResultHeadline,
        quiz_result_description: values.quizResultDescription,
      });
      return;
    }

    insertMutation.mutate([
      {
        name: values.name,
        user: user.id,
        published: values.published,
        description: values.description,
        background_image_url: values.backgroundImage,
        questions: values.questions,
        max_number_of_products_to_display: values.maxNumberOfProducts,
        gather_email: values.gatherEmail,
        result_page_slots: values.resultPageSlots,
        quiz_result_headline: values.quizResultHeadline,
        quiz_result_description: values.quizResultDescription,
      },
    ]);
  }

  const shareLink = form.watch("published")
    ? getProductionAnswerLink(quiz?.uuid ?? "")
    : getDevAnswerLink(quiz?.uuid ?? "");

  return (
    <Card className="mx-auto w-full h-full">
      <CardContent className="w-full h-full">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 h-full"
          >
            <div className="flex flex-row gap-4 justify-between max-h-full">
              <ScrollArea className="w-full">
                <div className="flex flex-1 flex-col h-full overflow-y-auto max-h-full">
                  <div className="flex flex-col gap-4">
                    <div className="pt-4">
                      <CardTitle className="text-left text-2xl font-bold">
                        {t("title")}
                      </CardTitle>
                    </div>

                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem
                          className={cn(
                            "flex flex-row items-center justify-between rounded-lg bg-primary border-primary p-4 text-primary-foreground ",
                            field.value && "bg-destructive border-destructive",
                          )}
                        >
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t("published.label")}
                            </FormLabel>
                            <If condition={Boolean(quiz)}>
                              <Then>
                                <div>
                                  <If condition={Boolean(shareLink)}>
                                    <Then>
                                      {t("published.description")}
                                      <div className="mt-2">
                                        {t("published.shareLink")}
                                        <CopyableText copyValue={shareLink}>
                                          <Link href={shareLink}>
                                            {shareLink}
                                          </Link>
                                        </CopyableText>
                                      </div>
                                    </Then>
                                  </If>
                                </div>
                              </Then>
                            </If>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Tabs value={tab} className="space-y-4">
                      <TabsList>
                        <TabsTrigger
                          value={FormTabs.FORM}
                          onClick={() => {
                            setTab(FormTabs.FORM);
                          }}
                        >
                          {t("formTabTitle")}
                        </TabsTrigger>
                        <TabsTrigger
                          value={FormTabs.RESULT}
                          onClick={() => {
                            setTab(FormTabs.RESULT);
                          }}
                        >
                          {t("resultTabTitle")}
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value={FormTabs.FORM} className="space-y-4">
                        <QuizBasicInfoSection />
                        <QuizQuestionsSection userId={user.id} />
                      </TabsContent>
                      <TabsContent
                        value={FormTabs.RESULT}
                        className="space-y-4"
                      >
                        <QuizResultSection userId={user.id} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
              <div className="h-[760px] min-w-[700px]">
                <div className="flex pt-4 h-full flex-col justify-between -mr-2">
                  <QuizFormPreview
                    displayedQuestionIndex={displayedQuestionIndex}
                    t={t}
                    tab={tab}
                    onDisplayedQuestionIndex={setDisplayedQuestionIndex}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    disabled={
                      insertMutation.isLoading || updateMutation.isLoading
                    }
                    size="lg"
                    type="submit"
                  >
                    {insertMutation.isLoading || updateMutation.isLoading
                      ? t("submitting")
                      : t("submit")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
