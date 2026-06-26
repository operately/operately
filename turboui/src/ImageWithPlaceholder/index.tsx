import * as React from "react";

export interface ImageWithPlaceholderProps {
  src: string;
  alt?: string;
  ratio: number;
}

const DEFAULT_RATIO = 1;
const LOADING_ANIMATION_NAME = "turboui-image-with-placeholder-loading";
const LOADING_KEYFRAMES = `
  @keyframes ${LOADING_ANIMATION_NAME} {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

export function calculateImageRatio(width?: number | null, height?: number | null) {
  if (!isPositiveNumber(width) || !isPositiveNumber(height)) {
    return DEFAULT_RATIO;
  }

  return normalizeImageRatio(height / width);
}

export function ImageWithPlaceholder({ src, alt, ratio }: ImageWithPlaceholderProps) {
  const [loaded, setLoaded] = React.useState(false);
  const safeRatio = normalizeImageRatio(ratio);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${safeRatio * 100}%`,
        overflow: "hidden",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 50%, #f5f5f5 75%)",
            backgroundSize: "200% 100%",
            animation: `${LOADING_ANIMATION_NAME} 3.5s infinite`,
          }}
        />
      )}

      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 500ms ease-in-out",
        }}
        onLoad={() => setLoaded(true)}
      />

      <style>{LOADING_KEYFRAMES}</style>
    </div>
  );
}

function normalizeImageRatio(ratio: number) {
  return Number.isFinite(ratio) && ratio > 0 ? ratio : DEFAULT_RATIO;
}

function isPositiveNumber(value?: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
