import * as React from "react";

export function Dropbox({ size }) {
  return (
    <svg
      enableBackground="new 0 0 128 128"
      version="1.1"
      viewBox="0 0 128 128"
      xmlSpace="preserve"
      xmlns="http://www.w3.org/2000/svg"
      width={size + "px"}
      height={size + "px"}
    >
      <rect clip-rule="evenodd" fill="none" fill-rule="evenodd" height="128" width="128" />
      <path
        clip-rule="evenodd"
        d="M128,28.78L90.348,4L64,26.167l37.964,23.626    L128,28.78z M64.077,78.191l-26.424,22.102l-11.308-7.443v8.342L64.077,124l37.732-22.808v-8.342l-11.308,7.443L64.077,78.191z     M37.653,4L0.001,28.779l26.036,21.014l37.964-23.626L37.653,4z M64,73.422L37.652,95.589L0,70.809l26.036-21.014L64,73.422    l37.963-23.63l26.036,21.018L90.347,95.589L64,73.422L64,73.422z"
        fill="#0F82E2"
        fill-rule="evenodd"
      />
    </svg>
  );
}
