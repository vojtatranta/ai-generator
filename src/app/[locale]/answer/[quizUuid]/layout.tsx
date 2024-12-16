import { auth } from "@/auth";
import { Toaster } from "@/web/components/ui/sonner";
import type { Metadata } from "next";
import { Lato } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "../../../globals.css";
import { QuizContainer } from "./_components/QuizContainer";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Perfect Pick Quiz",
  description: "We help you find the perfect cosmetics for your skin",
};

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { quizUuid: string };
}) {
  const supabase = await createSupabaseServerClient();
  const quiz = await supabase
    .from("quizes")
    .select("*")
    .eq("uuid", params.quizUuid)
    .single();

  if (!quiz.data) {
    notFound();
  }

  return (
    <QuizContainer className="max-h-screen overflow-auto py-4" quiz={quiz.data}>
      {children}
    </QuizContainer>
  );
}
