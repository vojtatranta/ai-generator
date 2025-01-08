import { memo, useEffect, useRef, useState } from "react";

export const AIGeneratedImage = memo(function AIGeneratedImage({
  alt,
  className,
  unstableUrl,
  stableUrl,
  width,
  height,
}: {
  alt?: string;
  className?: string;
  unstableUrl: string | null | undefined;
  stableUrl: string | null | undefined;
  width?: string;
  height?: string;
}) {
  const [effectiveSrc, setEffectiveSrc] = useState<string | null>(
    unstableUrl ?? stableUrl ?? "",
  );
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const preloadAnImage = (url: string) => {
    const img = new Image();
    img.src = url;

    return new Promise((resolve) => {
      img.onload = () => {
        resolve(img);
      };
    });
  };

  useEffect(() => {
    if (stableUrl && unstableUrl && effectiveSrc !== stableUrl) {
      preloadAnImage(stableUrl).then((img) => {
        setEffectiveSrc(stableUrl);
      });
    }
  }, [unstableUrl, stableUrl, effectiveSrc]);

  useEffect(() => {
    if (effectiveSrc) {
      setImageError(false);
    }
  }, [effectiveSrc]);

  if (!effectiveSrc) {
    return (
      <div
        style={{
          width: width ? `${width}` : "100%",
          height: height ? `${height}` : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, #ccc 25%, transparent 25%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        />
      </div>
    );
  }

  if (imageError) {
    return (
      <div
        style={{
          width: width ? `${width}` : "100%",
          height: height ? `${height}` : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ddd",
          backgroundImage:
            "linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, #ccc 25%, transparent 25%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5em",
            color: "#888",
          }}
        >
          <span role="img" aria-label="broken image"></span>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imageRef}
      src={effectiveSrc}
      className={className}
      alt={alt}
      width={width}
      height={height}
      onError={() => {
        setImageError(true);
      }}
    />
  );
});
