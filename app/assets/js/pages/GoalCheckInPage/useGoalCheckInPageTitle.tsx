import * as Pages from "@/components/Pages";
import { useLoadedData } from "./loader";

export function useGoalCheckInPageTitle(): string[] {
  const { update } = useLoadedData();
  const mode = Pages.usePageMode();

  if (mode === "edit") {
    return ["Editing", "Goal Check-In", update.goal!.name!];
  } else {
    return ["Goal Check-In", update.goal!.name!];
  }
}
