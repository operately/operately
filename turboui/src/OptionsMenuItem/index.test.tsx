import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { IconSpeakerphone } from "../icons";
import { OptionsMenuItem } from "./index";

function renderItem(props: Partial<React.ComponentProps<typeof OptionsMenuItem>> = {}) {
  return render(
    <MemoryRouter>
      <OptionsMenuItem icon={IconSpeakerphone} title="Operately v1.8" linkTo="/releases" {...props} />
    </MemoryRouter>,
  );
}

const longTitle = "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more";

describe("OptionsMenuItem", () => {
  it("lets the description wrap by default", () => {
    renderItem({ description: longTitle });

    expect(screen.getByText(longTitle)).not.toHaveClass("truncate");
  });

  it("keeps the description on one line when truncated, with the full text as a tooltip", () => {
    renderItem({ description: longTitle, truncateDescription: true });

    const description = screen.getByText(longTitle);

    expect(description).toHaveClass("truncate");
    expect(description).toHaveAttribute("title", longTitle);
  });

  it("opens the link in the requested target", () => {
    renderItem({ linkTo: "https://operately.com/releases/", linkTarget: "_blank" });

    expect(screen.getByRole("link", { name: "Operately v1.8" })).toHaveAttribute("target", "_blank");
  });
});
