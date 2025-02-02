import { useTranslations } from "next-intl";
import { memo, ReactElement, useState } from "react";
import { Maybe } from "actual-maybe";
import { Card, CardContent } from "@/components/ui/card";
import { RouterOutput } from "@/components/providers/TRPCProvider";
import { AIResult } from "@/lib/supabase-server";
import { searchParams } from "@/web/lib/searchparams";
import { FBShare } from "@/components/social";
import {
  ImagePreviewModal,
  WrappableImagePreviewModal,
} from "./ImagePreviewModal";
import { Pagination } from "@/components/ui/table/data-table";
import { useQueryState } from "nuqs";

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
  fbShare,
  renderResult,
  pagination,
}: {
  allResults: RenderResultType[];
  fbShare?: boolean;
  pagination?: {
    perPage: number;
    total: number;
  } | null;
  renderResult: (
    result: RenderResultType,
  ) => React.ReactNode | React.ReactElement | React.JSX.Element;
}) {
  const t = useTranslations();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [page, setPage] = useQueryState(
    "page",
    searchParams.page
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(1),
  );

  return (
    <>
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ""}
      />
      <Card className="max-w-[700px]">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            {pagination && (
              <Pagination
                totalItems={pagination.total}
                paginationState={{
                  pageSize: pagination.perPage,
                  pageIndex: page - 1,
                }}
                pageCount={Math.ceil(pagination.total / pagination.perPage)}
                canGetNextPage={
                  Math.ceil(pagination.total / pagination.perPage) > page
                }
                canGetPreviousPage={page > 1}
                onPageSet={setPage}
                onPreviousPage={() => setPage((prev) => prev - 1)}
                onNextPage={() => setPage((prev) => prev + 1)}
              />
            )}
          </div>
          {Maybe.fromFirst(allResults)
            .andThen(() => (
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-2">
                  {t("prompt.olderResults")}
                </div>

                <div className="space-y-4">
                  {allResults.map((result, index) => (
                    <div
                      key={`${result.id}`}
                      className="flex flex-col items-center space-x-2"
                    >
                      <div className="flex-1 w-full">
                        <div className="mb-1">
                          <div className="inline-block items-center justify-center w-6 h-6 mr-2 text-center bg-primary-foreground text-primary rounded-full">
                            {((page ?? 1) - 1) * (pagination?.perPage ?? 0) +
                              index +
                              1}
                          </div>
                          {Maybe.of(result.prompt ?? result.aiResult?.prompt)
                            .andThen((userPrompt) => (
                              <span className="text-sm text-gray-400">
                                {userPrompt}
                              </span>
                            ))
                            .orNull()}
                        </div>
                        <WrappableImagePreviewModal
                          src={result.aiResult?.image_url}
                        >
                          {renderResult(result)}
                        </WrappableImagePreviewModal>
                      </div>
                      <div className="flex items-center justify-center mt-2">
                        {fbShare && (
                          <FBShare
                            imageUrl={result.aiResult?.image_url}
                            text={t("generatedbyAIStein")}
                          />
                        )}
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
          <div className="flex items-center justify-between">
            {pagination && (
              <Pagination
                totalItems={pagination.total}
                paginationState={{
                  pageSize: pagination.perPage,
                  pageIndex: page - 1,
                }}
                pageCount={Math.ceil(pagination.total / pagination.perPage)}
                canGetNextPage={
                  Math.ceil(pagination.total / pagination.perPage) > page
                }
                canGetPreviousPage={page > 1}
                onPageSet={setPage}
                onPreviousPage={() => setPage((prev) => prev - 1)}
                onNextPage={() => setPage((prev) => prev + 1)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
});
