import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AssigneesField } from ".";

jest.mock("../icons", () => {
  const React = require("react");
  const Icon = () => React.createElement("span", { "aria-hidden": "true" });

  return {
    IconCircleX: Icon,
    IconSearch: Icon,
    IconUser: Icon,
    IconUserPlus: Icon,
  };
});

jest.mock("../Avatar", () => ({
  Avatar: ({ person }: { person: { fullName: string } }) => <span>{person.fullName}</span>,
  AvatarList: () => <span data-testid="avatar-list" />,
}));

const alice = { id: "1", fullName: "Alice Johnson", title: "Engineer", avatarUrl: null };
const bob = { id: "2", fullName: "Bob Smith", title: "Designer", avatarUrl: null };

function getClearButton(container: HTMLElement) {
  const button = container.ownerDocument.querySelector('[data-test-id="assignees-field-clear"]');
  if (!button) throw new Error("Expected clear button to render");
  return button;
}

describe("AssigneesField", () => {
  it("says Clear assignee when there is one assignee", () => {
    const { container } = render(
      <AssigneesField
        people={[alice]}
        setPeople={jest.fn()}
        searchData={{ people: [], onSearch: jest.fn().mockResolvedValue(undefined) }}
        testId="assignees-field"
      />,
    );

    fireEvent.click(container.querySelector('[data-test-id="assignees-field"]')!);

    expect(getClearButton(container)).toHaveTextContent("Clear assignee");
  });

  it("says Clear assignees when there are multiple assignees", () => {
    const { container } = render(
      <AssigneesField
        people={[alice, bob]}
        setPeople={jest.fn()}
        searchData={{ people: [], onSearch: jest.fn().mockResolvedValue(undefined) }}
        testId="assignees-field"
      />,
    );

    fireEvent.click(container.querySelector('[data-test-id="assignees-field"]')!);

    expect(getClearButton(container)).toHaveTextContent("Clear assignees");
  });
});
