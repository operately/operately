export type ResourceNameSize = "sm" | "base" | "lg";

export interface ResourceNameProps {
  type: "goal" | "project";
  name: string;
  
  href?: string;
  isCompleted?: boolean;
  isFailed?: boolean;
  isDropped?: boolean;
  isPending?: boolean;
  filter?: string;
  size?: ResourceNameSize;
}
