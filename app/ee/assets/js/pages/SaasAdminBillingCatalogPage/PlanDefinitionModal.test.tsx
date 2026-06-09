import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PlanDefinitionModal } from "./PlanDefinitionModal";

let mockCapturedConfig: any;
let mockCurrentValues: Record<string, any> | undefined;
let mockReset = jest.fn();
let mockCreate = jest.fn();
let mockUpdate = jest.fn();

jest.mock("@/ee/admin_api", () => ({
  useCreateBillingPlanDefinition: () => [mockCreate],
  useUpdateBillingPlanDefinition: () => [mockUpdate],
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
        mockCapturedConfig = config;
        mockCurrentValues = mockCurrentValues ?? { ...config.fields };

        return {
          values: mockCurrentValues,
          state: "idle",
          hasCancel: true,
          actions: {
            reset: mockReset,
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
      SelectBox: ({ label, field }: { label: string; field: string }) => (
        <div>
          {label}:{String(mockCurrentValues?.[field] ?? "")}
        </div>
      ),
      Submit: ({ saveText, cancelText }: { saveText: string; cancelText: string }) => (
        <div>
          {saveText}|{cancelText}
        </div>
      ),
    },
  };
});

jest.mock("turboui", () => {
  const { formatStorageBytes } = jest.requireActual("turboui/CompanyBilling");
  return { formatStorageBytes };
});

const teamPlanDefinition = {
  id: "plan_team",
  key: "team",
  displayName: "Team",
  sortOrder: 1,
  tierRank: 1,
  billingBehavior: "provider_managed",
  customerSelectable: true,
  archivedAt: null,
  memberLimit: 50,
  storageLimitBytes: 107_374_182_400,
};

function renderModal(planDefinition: any = teamPlanDefinition, values?: Partial<Record<string, any>>) {
  mockCapturedConfig = undefined;
  mockCurrentValues = values
    ? {
        planKey: planDefinition?.key ?? "",
        displayName: planDefinition?.displayName ?? "",
        sortOrder: String(planDefinition?.sortOrder ?? ""),
        tierRank: String(planDefinition?.tierRank ?? ""),
        billingBehavior: planDefinition?.billingBehavior ?? "provider_managed",
        customerSelectable: String(planDefinition?.customerSelectable ?? false),
        memberLimitMode: planDefinition?.memberLimit == null ? "unlimited" : "limited",
        memberLimit: planDefinition?.memberLimit == null ? "" : String(planDefinition.memberLimit),
        storageLimitMode: planDefinition?.storageLimitBytes == null ? "unlimited" : "limited",
        storageLimitBytes: planDefinition?.storageLimitBytes == null ? "" : String(planDefinition.storageLimitBytes),
        ...values,
      }
    : undefined;

  return renderToStaticMarkup(
    <PlanDefinitionModal
      isOpen={true}
      onClose={jest.fn()}
      onSuccess={jest.fn()}
      planDefinition={planDefinition as any}
    />,
  );
}

describe("PlanDefinitionModal", () => {
  beforeEach(() => {
    mockCapturedConfig = undefined;
    mockCurrentValues = undefined;
    mockReset = jest.fn();
    mockCreate = jest.fn().mockResolvedValue({ planDefinition: { id: "plan_team" } });
    mockUpdate = jest.fn().mockResolvedValue({ planDefinition: { id: "plan_team" } });
  });

  it("renders prefilled values, keeps plan key read-only, and shows lifecycle metadata", () => {
    const markup = renderModal();

    expect(markup).toContain("Edit plan definition");
    expect(markup).toContain("Plan key");
    expect(markup).toContain("team");
    expect(markup).toContain("Display Name:Team");
    expect(markup).toContain("Sort order:1");
    expect(markup).toContain("Tier rank:1");
    expect(markup).toContain("Billing behavior:provider_managed");
    expect(markup).toContain("Customer selectable:true");
    expect(markup).toContain("Member limit:limited");
    expect(markup).toContain("Member limit value:50");
    expect(markup).toContain("Storage limit bytes:107374182400");
    expect(markup).toContain("Preview: 100 GB");
    expect(markup).toContain("Save changes|Cancel");
    expect(mockCapturedConfig.fields.planKey).toBe("team");
  });

  it("hides limited inputs and the preview when both limits are unlimited", () => {
    const markup = renderModal(teamPlanDefinition, {
      memberLimitMode: "unlimited",
      memberLimit: "",
      storageLimitMode: "unlimited",
      storageLimitBytes: "",
    });

    expect(markup).toContain("Member limit:unlimited");
    expect(markup).toContain("Storage limit:unlimited");
    expect(markup).not.toContain("Member limit value:");
    expect(markup).not.toContain("Storage limit bytes:");
    expect(markup).not.toContain("Preview:");
  });

  it("renders create mode with an editable plan key", () => {
    mockCapturedConfig = undefined;
    mockCurrentValues = {
      planKey: "",
      displayName: "",
      sortOrder: "",
      tierRank: "",
      billingBehavior: "provider_managed",
      customerSelectable: "false",
      memberLimitMode: "unlimited",
      memberLimit: "",
      storageLimitMode: "unlimited",
      storageLimitBytes: "",
    };

    const markup = renderToStaticMarkup(
      <PlanDefinitionModal isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} planDefinition={undefined} />,
    );

    expect(markup).toContain("Create plan definition");
    expect(markup).toContain("Plan key:");
    expect(markup).toContain("Billing behavior:provider_managed");
    expect(markup).toContain("Customer selectable:false");
    expect(markup).toContain("Create plan|Cancel");
  });

  it("submits null limits when unlimited is selected", async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    mockCurrentValues = {
      planKey: "team",
      displayName: "Team Unlimited",
      sortOrder: "3",
      tierRank: "4",
      billingBehavior: "provider_managed",
      customerSelectable: "true",
      memberLimitMode: "unlimited",
      memberLimit: "999",
      storageLimitMode: "unlimited",
      storageLimitBytes: "999999",
    };

    renderToStaticMarkup(
      <PlanDefinitionModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        planDefinition={teamPlanDefinition as any}
      />,
    );

    await mockCapturedConfig.submit();

    expect(mockUpdate).toHaveBeenCalledWith({
      id: "plan_team",
      displayName: "Team Unlimited",
      sortOrder: 3,
      tierRank: 4,
      billingBehavior: "provider_managed",
      customerSelectable: true,
      memberLimit: null,
      storageLimitBytes: null,
    });
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("submits numeric member and storage limits when limited values are present", async () => {
    mockCurrentValues = {
      planKey: "team",
      displayName: "Team Plus",
      sortOrder: "8",
      tierRank: "9",
      billingBehavior: "provider_managed",
      customerSelectable: "false",
      memberLimitMode: "limited",
      memberLimit: "75",
      storageLimitMode: "limited",
      storageLimitBytes: "2048",
    };

    renderToStaticMarkup(
      <PlanDefinitionModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        planDefinition={teamPlanDefinition as any}
      />,
    );

    await mockCapturedConfig.submit();

    expect(mockUpdate).toHaveBeenCalledWith({
      id: "plan_team",
      displayName: "Team Plus",
      sortOrder: 8,
      tierRank: 9,
      billingBehavior: "provider_managed",
      customerSelectable: false,
      memberLimit: 75,
      storageLimitBytes: 2048,
    });
  });

  it("creates a new plan definition with full lifecycle metadata", async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    mockCurrentValues = {
      planKey: "enterprise",
      displayName: "Enterprise",
      sortOrder: "8",
      tierRank: "8",
      billingBehavior: "provider_managed",
      customerSelectable: "true",
      memberLimitMode: "limited",
      memberLimit: "500",
      storageLimitMode: "limited",
      storageLimitBytes: "5497558138880",
    };

    renderToStaticMarkup(
      <PlanDefinitionModal isOpen={true} onClose={onClose} onSuccess={onSuccess} planDefinition={undefined} />,
    );

    await mockCapturedConfig.submit();

    expect(mockCreate).toHaveBeenCalledWith({
      planKey: "enterprise",
      displayName: "Enterprise",
      sortOrder: 8,
      tierRank: 8,
      billingBehavior: "provider_managed",
      customerSelectable: true,
      memberLimit: 500,
      storageLimitBytes: 5497558138880,
    });
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("forces internal plans to submit customerSelectable as false", async () => {
    mockCurrentValues = {
      planKey: "trial_90_day",
      displayName: "Trial 90 Day",
      sortOrder: "10",
      tierRank: "10",
      billingBehavior: "internal",
      customerSelectable: "true",
      memberLimitMode: "unlimited",
      memberLimit: "",
      storageLimitMode: "unlimited",
      storageLimitBytes: "",
    };

    renderToStaticMarkup(
      <PlanDefinitionModal isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} planDefinition={undefined} />,
    );

    await mockCapturedConfig.submit();

    expect(mockCreate).toHaveBeenCalledWith({
      planKey: "trial_90_day",
      displayName: "Trial 90 Day",
      sortOrder: 10,
      tierRank: 10,
      billingBehavior: "internal",
      customerSelectable: false,
      memberLimit: null,
      storageLimitBytes: null,
    });
  });
});
