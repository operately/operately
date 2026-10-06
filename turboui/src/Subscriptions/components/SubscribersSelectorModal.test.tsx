import { i18n, setupTestCatalog } from "../../../test/i18n";
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
  asSubscriber(
    { id: "person-1", fullName: "Ada Lovelace", title: "Champion", avatarUrl: null, profileLink: "#" },
    { role: "Champion" },
  ),
  asSubscriber(
    { id: "person-2", fullName: "Grace Hopper", title: "Reviewer", avatarUrl: null, profileLink: "#" },
    { role: "Reviewer" },
  ),
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

setupTestCatalog();

it("translates known roles while keeping user names and custom roles literal", async () => {
  i18n.addResource("pt-BR", "translation", "Champion", "Papel traduzido");
  await i18n.changeLanguage("pt-BR");
  const custom = asSubscriber(
    { id: "custom", fullName: "Champion", title: "", avatarUrl: null, profileLink: "#" },
    { role: "Custom role" },
  );
  render(
    <SubscribersSelectorModal
      isOpen
      onClose={jest.fn()}
      subscribers={[...subscribers, custom]}
      selectedSubscribers={[]}
      alwaysNotify={[]}
      onSave={jest.fn()}
    />,
  );
  expect(await screen.findByText("Papel traduzido")).toBeInTheDocument();
  expect(screen.getByText("Revisor")).toBeInTheDocument();
  expect(screen.getByText("Champion")).toBeInTheDocument();
  expect(screen.getByText("Custom role")).toBeInTheDocument();
});
