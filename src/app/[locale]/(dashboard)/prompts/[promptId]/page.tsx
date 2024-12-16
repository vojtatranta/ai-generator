import { notFound } from "next/navigation";
import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import PageContainer from "@/components/layout/page-container";
import CreateQuizForm from "../_components/create-quiz-form";

export const metadata = {
  title: "Dashboard : Quiz",
};

export default async function Page({ params }: { params: { quizId: string } }) {
  const user = await getUser();
  const supabase = await createSupabaseServerClient();
  const quiz = await supabase
    .from("quizes")
    .select("*")
    .eq("id", params.quizId)
    .eq("user", user.id)
    .single();

  if (!quiz.data) {
    notFound();
  }

  return (
    <div className="max-h-full p-2 md:px-6 h-[calc(100dvh-62px)]">
      <CreateQuizForm user={user} quiz={quiz.data} />
    </div>
  );
}
