import { cn } from "@/lib/utils";
import { FC, memo } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);

type LangtailMarkdownBlockProps = Options & {
  children: React.ReactNode;
  hideCodeHeader?: boolean;
  className?: string;
  loading?: boolean;
};

export const LangtailMarkdownBlock: FC<LangtailMarkdownBlockProps> = ({
  hideCodeHeader,
  children,
  className,
  loading,
}) => {
  return (
    <MemoizedReactMarkdown
      className={cn(
        "prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0",
        className,
      )}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a({ children, href }) {
          return (
            <a
              href={href}
              target="_blank"
              style={{ textDecoration: "underline" }}
              rel="noopener noreferrer underline"
            >
              {children}
            </a>
          );
        },
        p({ children: localChildren }) {
          return <p className="mb-2 last:mb-0">{localChildren}</p>;
        },
        code(allProps) {
          const {
            node,
            className,
            children: localChildren,
            ...props
          } = allProps;
          if (children && Array.isArray(localChildren)) {
            if (localChildren[0] == "▍") {
              return (
                <span className="mt-1 animate-pulse cursor-default">▍</span>
              );
            }

            localChildren[0] = (localChildren[0] as string).replace("`▍`", "▍");
          }

          const match = /language-(\w+)/.exec(className || "");

          return <code>{localChildren}</code>;
        },
        iframe({ node, ...props }) {
          const { children: localChildren, ...rest } = props;

          if (loading) {
            return (
              <div className="relative flex aspect-video max-h-[400px] max-w-[500px] flex-col gap-2 rounded-md border border-white/5 bg-gray-900 p-2">
                <div className="absolute inset-0 flex h-full w-full items-center justify-center">
                  Preparing
                </div>
              </div>
            );
          }

          if (localChildren) {
            return (
              <div className="relative flex aspect-video max-h-[400px] max-w-[500px] flex-col gap-2 rounded-md border border-white/5 bg-gray-900 p-2">
                <iframe
                  {...rest}
                  srcDoc={`<style>html { width: 100%; height: 100%; background: #111827; } body { width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; } img { max-width: auto; height: 100%; } video { max-width: 100%; height: auto }</style>${String(
                    props.children,
                  )}`}
                  sandbox="allow-scripts"
                  width="100%"
                  height="100%"
                ></iframe>
              </div>
            );
          }

          return (
            <div className="relative flex aspect-video max-h-[400px] max-w-[500px] flex-col gap-2 rounded-md border border-white/5 bg-gray-900 p-2">
              <iframe
                {...rest}
                sandbox="allow-scripts allow-same-origin"
                width="100%"
                height="100%"
              />
            </div>
          );
        },
      }}
    >
      {children}
    </MemoizedReactMarkdown>
  );
};

export const MemoizedLangtailMarkdownBlock = memo(
  LangtailMarkdownBlock,
) as typeof LangtailMarkdownBlock;
