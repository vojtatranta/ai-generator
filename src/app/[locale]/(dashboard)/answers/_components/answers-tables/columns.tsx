"use client";
import { Checkbox } from "@/web/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { CopyableText } from "@/web/components/CopyableText";
import { Answer } from "@/web/lib/supabase-server";
import { Maybe } from "actual-maybe";
import { getQuizResultRedirectLink } from "@/lib/public-links";
import Link from "next/link";

export const getAnswerColumns = (
  t: (key: string) => string,
): ColumnDef<Answer>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "client_email",
    header: "CLIENT EMAIL",
    cell: ({ row }) => {
      const { client_email } = row.original;
      return <div>{client_email || "N/A"}</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: "CREATED AT",
    cell: ({ row }) => {
      const formattedDate = new Date(row.original.created_at).toLocaleString();
      return <div>{formattedDate}</div>;
    },
  },
  {
    accessorKey: "quiz_result",
    header: "QUIZ result page",
    cell: ({ row }) => {
      const { quiz_result } = row.original;
      return (
        <div>
          {Maybe.of(quiz_result)
            .map((result) => {
              const answerUrl = getQuizResultRedirectLink(result);
              return (
                <Link key={answerUrl} href={answerUrl}>
                  {t("listing.viewResultPage")}
                </Link>
              );
            })
            .getValue("N/A")}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "answers",
  //   header: "ANSWERS",
  //   cell: ({ row }) => {
  //     const formattedAnswers = JSON.stringify(row.original.answers, null, 2);
  //     return (
  //       <CopyableText copyValue={formattedAnswers}>
  //         <pre>{formattedAnswers}</pre>
  //       </CopyableText>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "questions",
  //   header: "QUESTIONS",
  //   cell: ({ row }) => {
  //     const formattedQuestions = JSON.stringify(
  //       row.original.questions,
  //       null,
  //       2
  //     );
  //     return (
  //       <CopyableText copyValue={formattedQuestions}>
  //         <pre>{formattedQuestions}</pre>
  //       </CopyableText>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "scoring",
  //   header: "SCORING",
  //   cell: ({ row }) => {
  //     const formattedScoring = JSON.stringify(row.original.scoring, null, 2);
  //     return (
  //       <CopyableText copyValue={formattedScoring}>
  //         <pre>{formattedScoring}</pre>
  //       </CopyableText>
  //     );
  //   },
  // },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
