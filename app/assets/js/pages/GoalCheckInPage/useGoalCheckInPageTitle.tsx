import * as Pages from "@/components/Pages";
import { useLoadedData } from "./loader";

export function useGoalCheckInPageTitle(): string[] {
  const { goal } = useLoadedData();
  const mode = Pages.usePageMode();

  if (mode === "edit") {
    return ["Editing", "Goal Check-In", goal.name];
  } else {
    return ["Goal Check-In", goal.name];
  }
}
