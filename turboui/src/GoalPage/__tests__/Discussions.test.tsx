import React from "react";
import { render, screen } from "@testing-library/react";
import { Discussions } from "../Discussions";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

jest.mock("../../Callouts", () => ({
  InfoCallout: ({ message, description }: any) => (
    <div data-testid="info-callout">
      <div>{message}</div>
      <div>{description}</div>
    </div>
  ),
}));

jest.mock("../../DiscussionCard", () => ({
  DiscussionCard: ({ discussion }: any) => (
    <div data-testid="discussion-card">
      {discussion.title}
    </div>
  ),
}));

describe("Discussions", () => {
  const defaultProps: any = {
    discussions: [],
    canAddDiscussion: false,
    state: "active",
    newDiscussionLink: "/new-discussion",
    richTextHandlers: {
        mentionedPersonLookup: () => null,
    },
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    );
  };

  it("renders nothing if goal is active, no discussions, and cannot edit", () => {
    const { container } = renderWithRouter(<Discussions {...defaultProps} canAddDiscussion={false} state="active" discussions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 'No discussions yet' (open zero state) if goal is active, no discussions, and CAN edit", () => {
    renderWithRouter(<Discussions {...defaultProps} canAddDiscussion={true} state="active" discussions={[]} />);
    expect(screen.getByText("No discussions yet")).toBeInTheDocument();
    expect(screen.getByText("Start discussion")).toBeInTheDocument();
  });

  it("renders 'This goal is closed and has no discussions' if goal is closed and no discussions", () => {
    renderWithRouter(<Discussions {...defaultProps} canAddDiscussion={true} state="closed" discussions={[]} />);
    expect(screen.getByText("This goal is closed and has no discussions.")).toBeInTheDocument();
    expect(screen.queryByText("Start discussion")).not.toBeInTheDocument();
  });

  it("renders 'This goal is closed and has no discussions' if goal is closed and no discussions (cannot edit)", () => {
    renderWithRouter(<Discussions {...defaultProps} canAddDiscussion={false} state="closed" discussions={[]} />);
    expect(screen.getByText("This goal is closed and has no discussions.")).toBeInTheDocument();
  });

  it("renders discussions if they exist", () => {
    const discussions = [
      {
        id: "1",
        title: "Discussion 1",
        author: { id: "1", fullName: "John Doe", avatarUrl: null, title: "Dev", profileLink: "" },
        date: new Date(),
        link: "",
        content: "",
        commentCount: 0,
      },
      {
        id: "2",
        title: "Discussion 2",
        author: { id: "2", fullName: "Jane Doe", avatarUrl: null, title: "Dev", profileLink: "" },
        date: new Date(),
        link: "",
        content: "",
        commentCount: 0,
      },
    ];

    renderWithRouter(<Discussions {...defaultProps} canAddDiscussion={true} state="active" discussions={discussions} />);
    
    expect(screen.getAllByTestId("discussion-card")).toHaveLength(2);
    expect(screen.getByText("Discussion 1")).toBeInTheDocument();
    expect(screen.getByText("Discussion 2")).toBeInTheDocument();
  });
});
