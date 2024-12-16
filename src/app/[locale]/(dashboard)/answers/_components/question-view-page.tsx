import AnswerForm from "./answer-form";
import PageContainer from "@/web/components/layout/page-container";
import {
  createSupabaseServerClient,
  Question,
} from "@/web/lib/supabase-server";
import { Answer } from "@/web/lib/supabase-server";

export default async function AnswerViewPage({ answer }: { answer: Answer }) {
  const supabase = await createSupabaseServerClient();
  const users = await supabase.auth.admin.listUsers();

  return (
    <PageContainer>
      <AnswerForm answer={answer} users={users.data?.users ?? []} />
    </PageContainer>
  );
}
