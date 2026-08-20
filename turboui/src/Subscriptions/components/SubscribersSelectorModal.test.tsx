import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SubscribersSelectorModal } from "./SubscribersSelectorModal";
import { asSubscriber } from "../../utils/storybook/genSubscribers";

jest.mock("../../icons", () => ({
  IconSearch: () => <span />,
  IconX: () => <span />,
}));

const subscribers = [
  asSubscriber({ id: "person-1", fullName: "Ada Lovelace", title: "Champion", avatarUrl: null, profileLink: "#" }, { role: "Champion" }),
  asSubscriber({ id: "person-2", fullName: "Grace Hopper", title: "Reviewer", avatarUrl: null, profileLink: "#" }, { role: "Reviewer" }),
  asSubscriber(
    { id: "person-3", fullName: "Katherine Johnson", title: "Contributor", avatarUrl: null, profileLink: "#" },
    { role: "Contributor" },
  ),
];

describe("SubscribersSelectorModal", () => {
  it("filters people by name", async () => {
    render(
      <SubscribersSelectorModal
        isOpen
        onClose={jest.fn()}
        subscribers={subscribers}
        selectedSubscribers={subscribers}
        alwaysNotify={[]}
        onSave={jest.fn()}
      />,
    );

    await screen.findByText("Ada Lovelace");

    fireEvent.change(screen.getByPlaceholderText("Find people"), { target: { value: "grace" } });

    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
      expect(screen.queryByText("Katherine Johnson")).not.toBeInTheDocument();
    });
  });
});
