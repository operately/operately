import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ProductReleaseAnnouncement, PRODUCT_RELEASES_PAGE_URL } from "./index";
import { v18ProductRelease } from "./mockData";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

function renderAnnouncement(props: Partial<ProductReleaseAnnouncement.Props> = {}) {
  const onDismiss = props.onDismiss ?? jest.fn();

  return {
    onDismiss,
    ...render(
      <MemoryRouter>
        <ProductReleaseAnnouncement release={v18ProductRelease} onDismiss={onDismiss} {...props} />
      </MemoryRouter>,
    ),
  };
}

describe("ProductReleaseAnnouncement", () => {
  it("links View release to the public releases page", () => {
    renderAnnouncement();

    const link = screen.getByRole("link", { name: "View release" });

    expect(link).toHaveAttribute("href", PRODUCT_RELEASES_PAGE_URL);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows the title without a subtitle", () => {
    renderAnnouncement();

    expect(screen.getByText(v18ProductRelease.title)).toBeInTheDocument();
    expect(screen.queryByText(/Bring AI into your work/)).not.toBeInTheDocument();
  });

  it("calls onDismiss from the toast", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderAnnouncement();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

test("looks up announcement controls while preserving the release title", async () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    { "New release": "Translated release", "View release": "Translated action", Dismiss: "Translated dismiss" },
    true,
    true,
  );

  const user = userEvent.setup();
  const { onDismiss } = renderAnnouncement({ release: { ...v18ProductRelease, title: "Literal <b> & title" } });

  expect(screen.getByText("Translated release")).toBeInTheDocument();
  expect(screen.getByText("Literal <b> & title")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Translated action" })).toHaveAttribute("href", PRODUCT_RELEASES_PAGE_URL);

  await user.click(screen.getByRole("button", { name: "Translated dismiss" }));

  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(document.querySelector("b")).toBeNull();
});

test.each(["pt-BR", "missing"])("Portuguese controls and fallback: %s", async (language) => {
  if (language === "missing") i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  renderAnnouncement();

  expect(screen.getByText(language === "pt-BR" ? "Nova versão" : "New release")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: language === "pt-BR" ? "Ver versão" : "View release" })).toHaveAttribute(
    "href",
    PRODUCT_RELEASES_PAGE_URL,
  );
  expect(screen.getByRole("button", { name: language === "pt-BR" ? "Dispensar" : "Dismiss" })).toBeInTheDocument();
});
