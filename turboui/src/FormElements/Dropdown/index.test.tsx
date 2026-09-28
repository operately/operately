import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Dropdown } from ".";

const items = [
  { id: "en", name: "English" },
  { id: "pt-BR", name: "Português (Brasil)" },
];

test("uses the associated label as the trigger accessible name", () => {
  render(
    <>
      <label id="language-label" htmlFor="language">
        Language
      </label>
      <Dropdown items={items} value="en" onSelect={jest.fn()} id="language" ariaLabelledBy="language-label" />
    </>,
  );

  expect(screen.getByRole("button", { name: "Language" })).toHaveTextContent("English");
});
