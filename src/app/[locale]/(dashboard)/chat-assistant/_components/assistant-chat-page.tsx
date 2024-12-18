import PageContainer from "@/web/components/layout/page-container";
import { buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn } from "@/web/lib/utils";
import { Plus } from "lucide-react";
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

type TSocketsListingPage = {};

export default async function AssistantChatPage({}: TSocketsListingPage) {
  const t = await getTranslations();

  return (
    <PageContainer>
      <Card>
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

        <AssistantAIChatContainer />
      </Card>
    </PageContainer>
  );
}
