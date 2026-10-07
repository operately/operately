import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { Avatar } from ".";

test("falls back to initials when the avatar image fails to load", () => {
  render(
    <Avatar person={{ fullName: "Marko Anastasov", avatarUrl: "https://example.com/missing-avatar.png" }} size={64} />,
  );

  fireEvent.error(screen.getByRole("img", { name: "Marko Anastasov" }));

  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("MA")).toBeInTheDocument();
  expect(screen.getByTitle("Marko Anastasov")).toHaveStyle({ width: "64px", height: "64px" });
});

test("loads a new avatar URL after a previous image fails", () => {
  const person = { fullName: "Marko Anastasov", avatarUrl: "https://example.com/missing-avatar.png" };
  const { rerender } = render(<Avatar person={person} size={64} />);

  fireEvent.error(screen.getByRole("img", { name: "Marko Anastasov" }));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();

  rerender(<Avatar person={{ ...person, avatarUrl: "https://example.com/replacement-avatar.png" }} size={64} />);

  expect(screen.getByRole("img", { name: "Marko Anastasov" })).toHaveAttribute(
    "src",
    "https://example.com/replacement-avatar.png",
  );
});
