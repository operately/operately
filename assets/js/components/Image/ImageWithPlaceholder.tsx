import React, { useState } from "react";

interface Props {
  src: string;
  alt?: string;
  ratio: number;
}

export function ImageWithPlaceholder({ src, alt, ratio }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${ratio * 100}%`,
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
            animation: "loading 3.5s infinite",
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
      <style>
        {`
          @keyframes loading {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
      </style>
    </div>
  );
}
