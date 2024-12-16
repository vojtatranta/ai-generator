import { Badge } from "@/components/ui/badge";

export function QuizAnswerHeader({
  quizName,
  quizDescription,
  testMode,
}: {
  quizName: string | null;
  quizDescription?: string | null;
  testMode?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center">{quizName}</h1>
      {testMode && (
        <div className="mt-4">
          <Badge variant="destructive" className="text-white/90 font-bold">
            Test mode
          </Badge>
        </div>
      )}
      {quizDescription && (
        <p className="mt-4 text-gray-600 text-center">{quizDescription}</p>
      )}
    </div>
  );
}
