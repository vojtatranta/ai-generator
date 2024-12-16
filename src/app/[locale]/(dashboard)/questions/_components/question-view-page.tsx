import QuestionForm from "./question-form";
import PageContainer from "@/web/components/layout/page-container";
import {
  createSupabaseServerClient,
  Question,
} from "@/web/lib/supabase-server";

export default async function QuestionViewPage({
  question,
}: {
  question: Question;
}) {
  const supabase = await createSupabaseServerClient();
  const users = await supabase.auth.admin.listUsers();

  return (
    <PageContainer>
      <QuestionForm question={question} users={users.data?.users ?? []} />
    </PageContainer>
  );
}
