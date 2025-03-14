import * as React from "react";

export function GoogleSlides({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width={size + "px"} height={size + "px"}>
      <path
        fill="#ffc107"
        d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"
      />
      <path fill="#ffecb3" d="M40 13L30 13 30 3z" />
      <path fill="#ffa000" d="M30 13L40 23 40 13z" />
      <path
        fill="#fff"
        d="M30,22H18c-1.1,0-2,0.9-2,2v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V24C32,22.9,31.1,22,30,22z M30,26v8H18v-8H30z"
      />
    </svg>
  );
}
