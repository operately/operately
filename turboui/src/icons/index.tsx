import { IconTarget } from "@tabler/icons-react";
import classNames from "../utils/classnames";
import { IconChecklist } from "@tabler/icons-react";

interface IconProps {
  size?: number;
  className?: string;
}

export function IconGoal({ size = 16, className = "" }: IconProps) {
  const outer = classNames(
    "flex-shrink-0 rounded-full flex items-center justify-center",
    "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30",
    className,
  );

  const innerSize = size - 8;

  return (
    <div className={outer} style={{ width: size, height: size }}>
      <IconTarget size={innerSize} />
    </div>
  );
}

export function IconProject({ size = 16, className = "" }: IconProps) {
  const outer = classNames(
    "flex-shrink-0 w-5 rounded-full flex items-center justify-center",
    "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
    className,
  );

  const innerSize = size - 8;

  return (
    <div className={outer} style={{ width: size, height: size }}>
      <IconChecklist size={innerSize} />
    </div>
  );
}
