import { IconTarget, IconHexagons } from "@tabler/icons-react";
import classNames from "../utils/classnames";
import { ResourceNameProps } from "./types";

const SIZE_CONFIG = {
  sm: {
    iconSize: 10,
    containerSize: "w-4 h-4",
    spacing: "mr-1.5",
    textSize: "text-xs",
  },
  base: {
    iconSize: 12,
    containerSize: "w-5 h-5",
    spacing: "mr-2",
    textSize: "text-xs md:text-sm",
  },
  lg: {
    iconSize: 14,
    containerSize: "w-6 h-6",
    spacing: "mr-2.5",
    textSize: "text-sm md:text-base",
  },
};

export function ResourceName({
  type,
  name,
  href = "#",
  isCompleted,
  isFailed,
  isDropped,
  isPending,
  filter,
  size = "base",
}: ResourceNameProps) {
  const isGoal = type === "goal";
  const isProject = type === "project";

  const { iconSize, containerSize, spacing, textSize } = SIZE_CONFIG[size];

  const iconContainerClasses = classNames(
    `flex-shrink-0 ${containerSize} rounded-full flex items-center justify-center ${spacing}`,
    isGoal
      ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
      : "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
  );

  const linkClasses = classNames(
    `font-medium ${textSize} hover:underline transition-colors`,
    isCompleted || isFailed ? "line-through" : "",
    isDropped ? "line-through opacity-70" : "",
    isPending ? "text-content-dimmed dark:text-gray-400" : "",
    filter === "completed" && (isCompleted || isFailed || isDropped)
      ? "text-content-dimmed dark:text-gray-400"
      : isCompleted || isFailed || isDropped
      ? "text-content-dimmed dark:text-gray-400"
      : "text-content-base dark:text-gray-200 hover:text-link-hover dark:hover:text-white"
  );

  return (
    <>
      <div className={iconContainerClasses}>
        {isGoal && <IconTarget size={iconSize} />}
        {isProject && <IconHexagons size={iconSize} />}
      </div>

      <div className="flex items-center">
        <a href={href} className={linkClasses}>
          {name}
        </a>
      </div>
    </>
  );
}

export default ResourceName;
