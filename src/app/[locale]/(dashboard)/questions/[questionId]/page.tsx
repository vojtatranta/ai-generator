import { notFound } from "next/navigation";
import QuestionViewPage from "../_components/question-view-page";
import { createSupabaseServerClient } from "@/web/lib/supabase-server";

export const metadata = {
  title: "Dashboard : Socket View",
};

export default async function Page({
  params,
}: {
  params: { questionId: string };
}) {
  const supabase = await createSupabaseServerClient();
  const question = await supabase
    .from("questions")
    .select("*")
    .eq("id", params.questionId)
    .single();

  if (!question.data) {
    notFound();
  }

  return <QuestionViewPage question={question.data} />;
}
