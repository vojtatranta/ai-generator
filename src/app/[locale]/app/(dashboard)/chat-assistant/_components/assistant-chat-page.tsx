import PageContainer from "@/web/components/layout/page-container";
import { buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn } from "@/web/lib/utils";
import { CircleAlert, Plus } from "lucide-react";
import Link from "next/link";
import PromptTemplatesTable from "./assistant-chat-container";
import { getTranslations } from "next-intl/server";
import { USED_PROMPTS } from "@/constants/data";
import AssistantChatContainer from "./assistant-chat-container";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssistantAIChatContainer } from "./assistant-chat-container/AssistantChatContainer";
import { PlanFeatureLimitation } from "@/components/plan-restriction";
import { getSureUserPlan } from "@/lib/stripe";
import { FEATURES } from "@/constants/plan";
import { getSubscriptionLink } from "@/lib/private-links";

type TSocketsListingPage = {};

export default async function AssistantChatPage({}: TSocketsListingPage) {
  const t = await getTranslations();
  const surePlanDesc = await getSureUserPlan();

  return (
    <PageContainer stretch>
      <div className="h-full min-h-full flex flex-1 overflow-hidden rounded-xl">
        {/* <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("assistantChat.title")}
          </CardTitle>

          <CardDescription>{t("assistantChat.description")}</CardDescription>
        </CardHeader> */}

        {/* <Link
            href={"/quizes/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" />{" "}
            {t("promptTemplate.listing.addNew")}
          </Link> */}

        <PlanFeatureLimitation
          planDescr={surePlanDesc}
          requestedFeatures={[FEATURES.AI_CHAT]}
          forbiddenFallback={
            <div className="flex items-center mt-20 justify-center min-h-full w-full h-full">
              <div className="bg-destructive p-4 text-primary-foreground rounded-md max-w-[650px]">
                <div className="flex flex-row items-center gap-2">
                  <CircleAlert className="h-12 w-12 mr-2" />
                  <div className="flex flex-col gap-2">
                    <div className="font-medium">
                      {t(
                        `subscription.planDoesntHaveFeature.${FEATURES.AI_CHAT}`,
                      )}
                    </div>
                    <div>
                      <Link
                        href={getSubscriptionLink()}
                        className="text-primary-foreground underline"
                      >
                        {t("subscription.manageSubscriptionToupgrade")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <AssistantAIChatContainer />
        </PlanFeatureLimitation>
      </div>
    </PageContainer>
  );
}
