import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import BillingPickCompanyPageModule from "./index";

jest.mock("@/components/Pages", () => ({
  Page: ({ children, testId }: { children: React.ReactNode; testId?: string }) => <div data-test-id={testId}>{children}</div>,
  useLoadedData: jest.fn(() => ({ companies: [] })),
}));

jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/OperatelyLogo", () => ({
  OperatelyLogo: () => <div>logo</div>,
}));

jest.mock("turboui", () => ({
  IconBuildingEstate: () => <div>icon</div>,
}));

describe("BillingPickCompanyPage", () => {
  it("shows the updated empty state for users without billing access", () => {
    const Page = (BillingPickCompanyPageModule as any).Page;
    (global as any).window = { location: { search: "" } };
    const markup = renderToStaticMarkup(<Page />);

    expect(markup).toContain("You don&#x27;t have access to manage billing for any companies yet.");
  });
});
