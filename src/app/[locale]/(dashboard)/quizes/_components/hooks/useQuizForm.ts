import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Quiz, User } from "@/web/lib/supabase-server";
import { QuizFormType, quizFormSchema, quizToForm } from "../quiz-form";
import { useSupabase } from "@/web/lib/supabase-client";
import {
  useInsertMutation,
  useUpdateMutation,
} from "@supabase-cache-helpers/postgrest-react-query";
import { toast } from "sonner";
import { Maybe } from "actual-maybe";
import { useRouter } from "next/navigation";

export const useQuizForm = (user: User, quiz?: Quiz) => {
  const router = useRouter();
  const supabase = useSupabase();

  const insertMutation = useInsertMutation(
    supabase.from("quizes"),
    ["id"],
    "*",
    {
      onSuccess: async (addedEntities) => {
        Maybe.fromFirst(addedEntities).map((entity) => {
          toast.success("Quiz created");
          form.reset(quizToForm(entity));
          router.push(`/quizes/${entity.id}`);
        });
      },
    },
  );

  const updateMutation = useUpdateMutation(
    supabase.from("quizes"),
    ["id"],
    "*",
    {
      onSuccess: async (_, updatedEntity) => {
        toast.success("Quiz updated");
        form.reset(quizToForm(updatedEntity));
      },
    },
  );

  const form = useForm<QuizFormType>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: quizToForm(quiz),
  });

  const onSubmit = (values: QuizFormType) => {
    if (quiz) {
      updateMutation.mutate({
        id: quiz.id,
        name: values.name,
        user: user.id,
        published: values.published,
        gather_email: values.gatherEmail,
        description: values.description,
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
        gather_email: values.gatherEmail,
        result_page_slots: values.resultPageSlots,
        quiz_result_headline: values.quizResultHeadline,
        quiz_result_description: values.quizResultDescription,
      },
    ]);
  };

  return {
    form,
    onSubmit,
    isLoading: insertMutation.isLoading || updateMutation.isLoading,
  };
};
