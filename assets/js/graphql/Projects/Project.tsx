import * as KeyResources from "./key_resources";
import * as Milestones from "./milestones";
import * as PhaseHistory from "./phase_history";
import * as Permissions from "./permissions";
import * as Updates from "./updates";
import * as ReviewRequests from "@/graphql/ProjectReviewRequests";

export interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
}

interface Parent {
  id: string;
  title: string;
  type: "objective" | "project" | "tenet" | "company";
}

interface Contributor {
  id: string;
  person: Person;
  role: "champion" | "reviewer" | "contributor";
  responsibility: string;
}

export type ProjectPhase = "planning" | "execution" | "control" | "completed" | "canceled" | "paused";
export type ProjectHealth = "unknown" | "on_track" | "at_risk" | "off_track";

export interface Project {
  id: string;
  name: string;
  description: string;
  startedAt: Date;
  deadline: Date;
  phase: ProjectPhase;
  health: ProjectHealth;
  private: boolean;

  permissions: Permissions.Permissions;
  phaseHistory: PhaseHistory.PhaseHistory[];
  milestones: Milestones.Milestone[];
  keyResources: KeyResources.KeyResource[];

  spaceId: string;

  parents: Parent[];
  contributors: Contributor[];
  champion?: Person;
  reviewer?: Person;

  isPinned: boolean;
  isArchived: boolean;

  archivedAt: Date;

  reviewRequests: ReviewRequests.ReviewRequest[];
  lastCheckIn?: Updates.Update;
}
