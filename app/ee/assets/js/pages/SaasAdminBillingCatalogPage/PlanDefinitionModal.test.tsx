import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PlanDefinitionModal } from "./PlanDefinitionModal";

let mockCapturedConfig: any;
let mockCurrentValues: Record<string, any> | undefined;
let mockReset = jest.fn();
let mockUpdate = jest.fn();

jest.mock("@/ee/admin_api", () => ({
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
  memberLimit: 50,
  storageLimitBytes: 107_374_182_400,
};

function renderModal(values?: Partial<Record<string, any>>) {
  mockCapturedConfig = undefined;
  mockCurrentValues = values
    ? {
        displayName: teamPlanDefinition.displayName,
        sortOrder: String(teamPlanDefinition.sortOrder),
        memberLimitMode: "limited",
        memberLimit: String(teamPlanDefinition.memberLimit),
        storageLimitMode: "limited",
        storageLimitBytes: String(teamPlanDefinition.storageLimitBytes),
        ...values,
      }
    : undefined;

  return renderToStaticMarkup(
    <PlanDefinitionModal
      isOpen={true}
      onClose={jest.fn()}
      onSuccess={jest.fn()}
      planDefinition={teamPlanDefinition as any}
    />,
  );
}

describe("PlanDefinitionModal", () => {
  beforeEach(() => {
    mockCapturedConfig = undefined;
    mockCurrentValues = undefined;
    mockReset = jest.fn();
    mockUpdate = jest.fn().mockResolvedValue({ planDefinition: { id: "plan_team" } });
  });

  it("renders prefilled values, keeps plan key read-only, and shows the storage preview", () => {
    const markup = renderModal();

    expect(markup).toContain("Edit plan definition");
    expect(markup).toContain("Plan key");
    expect(markup).toContain("team");
    expect(markup).toContain("Display Name:Team");
    expect(markup).toContain("Sort order:1");
    expect(markup).toContain("Member limit:limited");
    expect(markup).toContain("Member limit value:50");
    expect(markup).toContain("Storage limit bytes:107374182400");
    expect(markup).toContain("Preview: 100 GB");
    expect(markup).toContain("Save changes|Cancel");
    expect(mockCapturedConfig.fields).not.toHaveProperty("planKey");
  });

  it("hides limited inputs and the preview when both limits are unlimited", () => {
    const markup = renderModal({
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

  it("submits null limits when unlimited is selected", async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    mockCurrentValues = {
      displayName: "Team Unlimited",
      sortOrder: "3",
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
      memberLimit: null,
      storageLimitBytes: null,
    });
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("submits numeric member and storage limits when limited values are present", async () => {
    mockCurrentValues = {
      displayName: "Team Plus",
      sortOrder: "8",
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
      memberLimit: 75,
      storageLimitBytes: 2048,
    });
  });
});
