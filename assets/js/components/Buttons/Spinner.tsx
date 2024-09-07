import React from "react";
import { PuffLoader } from "react-spinners";

export function Spinner({ active }: { active?: boolean }) {
  return (
    <div className="inset-0 flex items-center justify-center absolute">
      {active && <PuffLoader size={24} color="var(--color-white-1)" />}
    </div>
  );
}

// function Spinner({ active }: { active?: boolean }) {
//   return (
//     <div className="inset-0 flex items-center justify-center absolute">
//       {active && <PuffLoader size={24} color="var(--color-accent-1)" />}
//     </div>
//   );
// }
