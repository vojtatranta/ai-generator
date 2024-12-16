import { createSupabaseServerClient } from "@/web/lib/supabase-server";
import { notFound } from "next/navigation";
import QuizAnswerForm from "./_components/QuizAnswerForm";

export default async function QuizAnswerPage({
  params,
  searchParams,
}: {
  params: { quizUuid: string };
  searchParams: { test: boolean; question: number };
}) {
  const supabase = await createSupabaseServerClient();
  const quiz = searchParams.test
    ? await supabase
        .from("quizes")
        .select("*")
        .eq("uuid", params.quizUuid)
        .single()
    : await supabase
        .from("quizes")
        .select("*")
        .eq("uuid", params.quizUuid)
        .eq("published", true)
        .single();

  const testMode = Boolean(searchParams.test);

  const defaultQuestionIndex = searchParams.question || 0;

  if (!quiz.data) {
    notFound();
  }

  return (
    <QuizAnswerForm
      defaultIndex={defaultQuestionIndex}
      quiz={quiz.data}
      testMode={testMode}
    />
  );
}
