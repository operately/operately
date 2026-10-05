import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { SiteMessageBanner } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

test.each(["en", "pt-BR", "missing"])(
  "dismiss is translated while operator content stays literal: %s",
  async (language) => {
    if (language === "missing") i18n.removeResourceBundle("pt-BR", "translation");
    await i18n.changeLanguage(language === "missing" ? "pt-BR" : language);

    const onDismiss = jest.fn();
    render(
      <SiteMessageBanner
        title="Literal <title> & name"
        description={
          <p>
            Operator content <a href="/status">Status</a>
          </p>
        }
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Literal <title> & name:");
    expect(screen.getByRole("link", { name: "Status" })).toHaveAttribute("href", "/status");

    fireEvent.click(
      screen.getByRole("button", { name: language === "pt-BR" ? "Dispensar mensagem" : "Dismiss message" }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(document.querySelector("title")).toBeNull();
  },
);
