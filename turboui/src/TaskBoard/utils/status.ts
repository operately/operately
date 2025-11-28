import { Status } from "../types";

export function findCompletedStatus(statuses: Status[]) {
  for (const status of statuses) {
    if (status.color === "green") {
      return status;
    }
  }

  return null;
}
