import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProductModal } from "./ProductModal";

let mockCurrentValues: Record<string, any> | undefined;
let mockCreate = jest.fn();
let mockUpdate = jest.fn();
let mockSelectOptions: Record<string, { label: string; value: string }[]> = {};

jest.mock("@/ee/admin_api", () => ({
  useCreateBillingProduct: () => [mockCreate],
  useUpdateBillingProduct: () => [mockUpdate],
}));

jest.mock("@/components/Modal", () => ({
  __esModule: true,
  default: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
    isOpen ? (
      <section>
        <h1>{title}</h1>
        {children}
      </section>
    ) : null,
}));

jest.mock("@/components/Forms", () => {
  const React = require("react");

  return {
    __esModule: true,
    default: {
      useForm: jest.fn((config: any) => {
        mockCurrentValues = mockCurrentValues ?? { ...config.fields };

        return {
          values: mockCurrentValues,
          state: "idle",
          hasCancel: true,
          actions: {
            reset: jest.fn(),
            submit: jest.fn(),
            cancel: jest.fn(),
            clearErrors: jest.fn(),
            addErrors: jest.fn(),
            removeErrors: jest.fn(),
            addValidation: jest.fn(),
            removeValidation: jest.fn(),
            getValue: jest.fn(),
            setValue: jest.fn(),
            setState: jest.fn(),
            setTrigger: jest.fn(),
          },
        };
      }),
      Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      FieldGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      InputField: ({ label, children }: { label?: string; children: React.ReactNode }) => (
        <div>
          {label ? <div>{label}</div> : null}
          {children}
        </div>
      ),
      TextInput: ({ label, field }: { label: string; field: string }) => (
        <div>
          {label}:{String(mockCurrentValues?.[field] ?? "")}
        </div>
      ),
      NumberInput: ({ label, field }: { label: string; field: string }) => (
        <div>
          {label}:{String(mockCurrentValues?.[field] ?? "")}
        </div>
      ),
      SelectBox: ({
        label,
        field,
        options,
      }: {
        label: string;
        field: string;
        options: { label: string; value: string }[];
      }) => {
        mockSelectOptions[field] = options;

        return (
          <div>
            {label}:{String(mockCurrentValues?.[field] ?? "")}
          </div>
        );
      },
      Submit: ({ saveText, cancelText }: { saveText: string; cancelText: string }) => (
        <div>
          {saveText}|{cancelText}
        </div>
      ),
    },
  };
});

const planDefinitions = [
  {
    id: "plan_free",
    key: "free",
    displayName: "Free",
    tierRank: 0,
    billingBehavior: "internal",
    customerSelectable: false,
    archivedAt: null,
    memberLimit: 20,
    storageLimitBytes: 1_073_741_824,
  },
  {
    id: "plan_team",
    key: "team",
    displayName: "Team",
    tierRank: 1,
    billingBehavior: "provider_managed",
    customerSelectable: true,
    archivedAt: null,
    memberLimit: 50,
    storageLimitBytes: 107_374_182_400,
  },
  {
    id: "plan_business",
    key: "business",
    displayName: "Business",
    tierRank: 2,
    billingBehavior: "provider_managed",
    customerSelectable: true,
    archivedAt: null,
    memberLimit: 200,
    storageLimitBytes: 1_099_511_627_776,
  },
  {
    id: "plan_archived",
    key: "legacy_enterprise",
    displayName: "Legacy Enterprise",
    tierRank: 3,
    billingBehavior: "provider_managed",
    customerSelectable: false,
    archivedAt: "2026-06-08T00:00:00Z",
    memberLimit: null,
    storageLimitBytes: null,
  },
] as any[];

describe("ProductModal", () => {
  beforeEach(() => {
    mockCurrentValues = undefined;
    mockCreate = jest.fn().mockResolvedValue({ product: { id: "prod_team_monthly" } });
    mockUpdate = jest.fn().mockResolvedValue({ product: { id: "prod_team_monthly" } });
    mockSelectOptions = {};
  });

  it("loads create-mode plan options from active provider-managed plan definitions", () => {
    const markup = renderToStaticMarkup(
      <ProductModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        product={undefined}
        planDefinitions={planDefinitions as any}
      />,
    );

    expect(markup).toContain("Create product");
    expect(mockSelectOptions.planFamily).toEqual([
      { value: "team", label: "Team (team)" },
      { value: "business", label: "Business (business)" },
    ]);
  });

  it("keeps edit mode plan family read-only and formatted from plan definitions", () => {
    const markup = renderToStaticMarkup(
      <ProductModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        planDefinitions={planDefinitions as any}
        product={
          {
            id: "prod_business_monthly",
            provider: "polar",
            planFamily: "business",
            billingInterval: "monthly",
            polarProductName: "Business Monthly",
            priceAmount: 9900,
          } as any
        }
      />,
    );

    expect(markup).toContain("Edit product");
    expect(markup).toContain("Plan Family");
    expect(markup).toContain("Business (business)");
    expect(mockSelectOptions.planFamily).toBeUndefined();
  });
});
