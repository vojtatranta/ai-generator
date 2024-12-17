import { useTranslations } from "next-intl";
import { memo, ReactElement } from "react";
import { Maybe } from "actual-maybe";
import { Card, CardContent } from "@/components/ui/card";
import { RouterOutput } from "@/components/providers/TRPCProvider";
import { AIResult } from "@/lib/supabase-server";

export type InvokeOutput = RouterOutput["langtail"]["invokePrompt"];

export type RenderResultType = {
  id: string;
  aiResponse: InvokeOutput;
  aiResult: AIResult | null;
  prompt?: string;
};

export type ResultType = {
  id: string;
  prompt: string;
  result: InvokeOutput | null;
  aiResult?: AIResult | null;
};

export const PromptResultHistory = memo(function PromptResultHistory({
  allResults,
  renderResult,
}: {
  allResults: RenderResultType[];
  renderResult: (
    result: RenderResultType,
  ) => React.ReactNode | React.ReactElement | React.JSX.Element;
}) {
  const t = useTranslations();

  return (
    <Card className="max-w-[500px]">
      <CardContent className="py-6">
        {Maybe.fromFirst(allResults)
          .andThen(() => (
            <div>
              <div className="text-sm text-gray-500 mb-2">
                {t("prompt.olderResults")}
              </div>

              <div className="space-y-4">
                {allResults.map((result, index) => (
                  <div
                    key={`${index}-${result.aiResult?.prompt}`}
                    className="flex items-center space-x-2"
                  >
                    <div>
                      <div className="flex items-center justify-center w-6 h-6 mr-2 bg-primary-foreground text-primary rounded-full">
                        {index + 1}
                      </div>
                      {Maybe.of(result.aiResult?.prompt)
                        .andThen((userPrompt) => (
                          <span className="text-sm text-gray-400">
                            {userPrompt}
                          </span>
                        ))
                        .orNull()}

                      {renderResult(result)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
          .getValue(
            <div className="flex flex-col items-center justify-center">
              <div className="text-center text-sm text-gray-500">
                {t("prompt.postGenerationResultsEmptyStateText")}
              </div>
            </div>,
          )}
      </CardContent>
    </Card>
  );
});
