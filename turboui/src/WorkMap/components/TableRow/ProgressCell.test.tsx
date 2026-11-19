import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { mockGoalOnTrack, mockProjectOnTrack } from "../../tests/mockData";
import { ProgressCell } from "./ProgressCell";

describe("ProgressCell", () => {
  it.each([33, 67, 0])("uses project task progress of %i%% independently of milestones", (progress) => {
    const item = {
      ...mockProjectOnTrack,
      progress,
      taskCompletion: progress
        ? { completedCount: progress === 33 ? 1 : 2, totalCount: 3, percentage: progress }
        : null,
    };
    render(
      <table>
        <tbody>
          <tr>
            <ProgressCell item={item} />
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByTestId("progress-percentage-bar")).toHaveStyle({ width: `${progress}%` });
    expect(screen.getByTestId("project-progress-summary")).toBeInTheDocument();
  });

  it("preserves hidden progress for closed projects", () => {
    render(
      <table>
        <tbody>
          <tr>
            <ProgressCell item={{ ...mockProjectOnTrack, status: "achieved", progress: null }} />
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.queryByTestId("progress-percentage-bar")).not.toBeInTheDocument();
  });
  it("renders missing progress as zero", () => {
    const item = { ...mockGoalOnTrack, progress: null };

    render(
      <table>
        <tbody>
          <tr>
            <ProgressCell item={item} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId("progress-percentage-bar")).toHaveStyle({ width: "0%" });
  });
});
