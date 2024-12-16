import CreateQuizForm from "../_components/create-quiz-form";
import { getUser } from "@/web/lib/supabase-server";

export const metadata = {
  title: "Creating new quiz",
};

export default async function QuizNewPage() {
  const user = await getUser();

  return (
    <div className="max-h-full p-2 md:px-6 h-[calc(100dvh-62px)]">
      <CreateQuizForm user={user} />
    </div>
  );
}
