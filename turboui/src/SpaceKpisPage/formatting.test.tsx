import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { KpiDate, KpiFormattingProvider, useKpiFormatting } from "./formatting";
import { formatNumber, formatValue, fromIsoDate, toIsoDate } from "./utils";

const preferences = { locale: "pt-BR", timezone: "America/Sao_Paulo", timeFormat: "automatic" as const };

test("formats compact KPI values using the supplied locale and preserves literal units", () => {
  expect(formatNumber(1500, "en-US")).toBe("1.5K");
  expect(formatNumber(1500, "pt-BR")).toBe("1,5\u00a0mil");
  expect(formatNumber(-87.5, "pt-BR")).toBe("-87,5");
  expect(formatValue(87.5, "%", "pt-BR")).toBe("87,5%");
  expect(formatValue(87.5, "New Users", "pt-BR")).toBe("87,5 New Users");
});

test("uses explicit preferences for dates and numbers without shifting calendar periods", () => {
  function Values() {
    const { formatNumber, formatShortDate } = useKpiFormatting();
    return (
      <>
        <span data-testid="number">{formatNumber(1500)}</span>
        <span data-testid="date-label">{formatShortDate(fromIsoDate("2020-01-02"))}</span>
        <span data-testid="calendar">
          <KpiDate time={fromIsoDate("2020-01-02")} />
        </span>
        <span data-testid="timestamp">
          <KpiDate time={new Date("2020-01-02T01:00:00Z")} timestamp />
        </span>
      </>
    );
  }
  render(
    <KpiFormattingProvider value={preferences}>
      <Values />
    </KpiFormattingProvider>,
  );
  expect(screen.getByTestId("number")).toHaveTextContent("1,5 mil");
  expect(screen.getByTestId("calendar")).toHaveTextContent("2 de jan. de 2020");
  expect(screen.getByTestId("date-label")).toHaveTextContent("2 de jan. de 2020");
  expect(screen.getByTestId("timestamp")).toHaveTextContent("1 de jan. de 2020");
  expect(toIsoDate(fromIsoDate("2020-01-02"))).toBe("2020-01-02");
});
