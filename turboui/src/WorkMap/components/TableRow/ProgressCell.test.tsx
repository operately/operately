import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { mockGoalOnTrack } from "../../tests/mockData";
import { ProgressCell } from "./ProgressCell";

describe("ProgressCell", () => {
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
