import { memo, useEffect, useRef } from "react";

export const OutputIframe = memo(function OutputIframe({
  stringAsHtml,
}: {
  stringAsHtml: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = stringAsHtml.trim();
    }
  }, [stringAsHtml]);

  return <div className="w-full h-full" ref={divRef} />;
});
