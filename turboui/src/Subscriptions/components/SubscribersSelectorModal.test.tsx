import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { SubscribersSelectorModal } from "./SubscribersSelectorModal";
import type { SubscribersSelector } from "../SubscribersSelector";

jest.mock("../../icons", () => ({
  IconSearch: () => <span />,
  IconX: () => <span />,
}));

const subscribers: SubscribersSelector.Subscriber[] = [
  { person: { id: "person-1", fullName: "Ada Lovelace" }, role: "Champion" },
  { person: { id: "person-2", fullName: "Grace Hopper" }, role: "Reviewer" },
  { person: { id: "person-3", fullName: "Katherine Johnson" }, role: "Contributor" },
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
