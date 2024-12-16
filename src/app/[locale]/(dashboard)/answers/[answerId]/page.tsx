import { notFound } from "next/navigation";
import QuestionViewPage from "../_components/question-view-page";
import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import AnswerViewPage from "../_components/question-view-page";

export const metadata = {
  title: "Dashboard : Answer View",
};

export default async function Page({
  params,
}: {
  params: { answerId: string };
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  const answer = await supabase
    .from("answers")
    .select("*, quizes ( user )")
    .eq("quizes.user", user.id)
    .eq("id", params.answerId)
    .single();

  if (!answer.data) {
    notFound();
  }

  return <AnswerViewPage answer={answer.data} />;
}
