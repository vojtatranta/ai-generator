"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/web/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/web/components/ui/form";
import { Input } from "@/web/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/web/components/ui/card";
import Link from "next/link";
import { Quiz } from "@/web/lib/supabase-server";
import { useUpdateMutation } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { toast } from "sonner";
import { Textarea } from "@/web/components/ui/textarea";
import { quizQuestionSchema } from "@/lib/parsers";
import { MakeOptional } from "@/lib/ts-helpers";
import { ResultPageSlotsType } from "@/lib/contants";

export const resultPageSlotSchema = z.object({
  id: z.string(),
  entityId: z.string().nullable().optional(),
  type: z.nativeEnum(ResultPageSlotsType),
  description: z.string().nullable().optional(),
  productCount: z.number().nullable().optional().default(5),
});

export const resultPageSlotsSchema = z.array(resultPageSlotSchema).default([]);

export type ResultPageSlotsSchemaType = z.infer<typeof resultPageSlotsSchema>;

export const DEFAULT_NUMBER_OF_QUIZ_RESULT_PRODUCTS = 16;

export const quizFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  published: z.boolean().default(false),
  maxNumberOfProducts: z
    .number()
    .min(1)
    .default(DEFAULT_NUMBER_OF_QUIZ_RESULT_PRODUCTS),
  gatherEmail: z.boolean().default(false),
  backgroundImage: z.string().nullable().optional(),
  quizResultHeadline: z.string().nullable().optional(),
  quizResultDescription: z.string().nullable().optional(),
  actualImage: z.instanceof(File).nullable().optional(),
  questions: quizQuestionSchema,
  resultPageSlots: resultPageSlotsSchema,
});

export type QuizFormType = z.infer<typeof quizFormSchema>;

export const quizToForm = (
  quiz?: MakeOptional<Quiz> | null | undefined,
): QuizFormType => {
  return {
    name: quiz?.name ?? "",
    description: quiz?.description ?? "",
    maxNumberOfProducts:
      quiz?.max_number_of_products_to_display ??
      DEFAULT_NUMBER_OF_QUIZ_RESULT_PRODUCTS,
    published: Boolean(quiz?.published),
    questions: quizQuestionSchema.parse(quiz?.questions ?? []),
    quizResultHeadline: quiz?.quiz_result_headline ?? "",
    quizResultDescription: quiz?.quiz_result_description ?? "",
    backgroundImage: quiz?.background_image_url ?? null,
    gatherEmail: Boolean(quiz?.gather_email),
    resultPageSlots: resultPageSlotsSchema.parse(quiz?.result_page_slots ?? []),
    actualImage: null,
  };
};

export default function QuizForm({ quiz }: { quiz?: Quiz | null }) {
  const supabase = useSupabase();

  const mutation = useUpdateMutation(supabase.from("quizes"), ["id"], null, {
    onSuccess: async (_, updatedEntity) => {
      toast.success("Quiz updated");
      form.reset(quizToForm(updatedEntity));
    },
  });

  const form = useForm<QuizFormType>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: quizToForm(quiz),
  });

  function onSubmit(values: QuizFormType) {
    if (!quiz) {
      return;
    }

    mutation.mutate({
      id: quiz.id,
      name: values.name,
      description: values.description,
      questions: values.questions,
    });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {quiz && (
            <>
              <div className="space-y-8">
                Quiz questions:{" "}
                <Link href={`/quizes?quizId=${quiz.id}`}>View all</Link>
              </div>
            </>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button disabled={mutation.isLoading} type="submit">
              {mutation.isLoading ? "Updating..." : "Submit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
