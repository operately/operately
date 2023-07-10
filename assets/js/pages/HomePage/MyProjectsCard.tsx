import React from "react";

import { Card } from "./Card";
import * as Icons from "@tabler/icons-react";

export function MyProjectsCard() {
  return (
    <Card colSpan={1} linkTo="/home/my-projects">
      <h1 className="font-bold flex items-center gap-2">
        <Icons.IconTableFilled size={20} /> My Projects
      </h1>

      <div className="mt-4">
        <div className="font-bold flex items-center gap-2 bg-dark-5 rounded-lg px-2 py-1.5">
          <div className="text-dark-1 rounded-lg w-10 h-10 flex items-center justify-center bg-pink-400 font-extrabold text-xl">
            S
          </div>

          <div>
            Superpace
            <div className="text-xs font-medium">13 June - 17 July</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
