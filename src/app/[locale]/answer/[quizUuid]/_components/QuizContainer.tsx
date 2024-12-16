import { Quiz } from "@/lib/supabase-server";
import { memo } from "react";

export const QuizContainer = memo(function QuizContainer({
  children,
  className,
  quiz,
}: {
  children: React.ReactNode;
  quiz: Quiz;
  className?: string;
}) {
  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        quiz.background_image_url ? "bg-cover bg-center bg-no-repeat" : ""
      } ${className}`}
      style={{
        backgroundImage: quiz.background_image_url
          ? `url(${quiz.background_image_url})`
          : undefined,
      }}
    >
      <div className="flex flex-col items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
});
