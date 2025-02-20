import * as React from "react";

import { Section } from "./Section";
import { SecondaryButton } from "@/components/Buttons";
import classNames from "classnames";
import { BlackLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import Forms from "@/components/Forms";
import { IconPlus } from "@tabler/icons-react";
import { truncateString } from "@/utils/strings";

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;

export function Targets() {
  const [showForm, setShowForm] = React.useState(false);

  return (
    <Section title="Targets">
      <div className="flex flex-col gap-6">
        <div className="">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <BlackLink
                to={Paths.targetPath("1")}
                className="font-semibold decoration-stone-400 hover:decoration-black hover:text-black"
                underline="hover"
              >
                Physical Location Setup
              </BlackLink>

              <div className="text-xs text-content-dimmed mt-0.5">
                {truncateString(
                  "Create a fully functional, professional workspace that reflects our company culture and meets all operational needs. The setup should enable efficient work processes while ensuring security and comfort for employees and visitors.",
                  100,
                )}
              </div>
            </div>

            <div className="tracking-wide text-sm font-medium">3 / 11</div>
          </div>

          <LargeProgress progress={33} color="bg-accent-1" />
        </div>

        <div className="">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <BlackLink
                to={Paths.targetPath("2")}
                className="font-semibold decoration-stone-400 hover:decoration-black hover:text-black"
                underline="hover"
              >
                HR & Staffing
              </BlackLink>

              <div className="text-xs text-content-dimmed mt-0.5">
                {truncateString(
                  "Build a competent, well-trained team and establish all necessary HR processes. This ensures we have the right people in place and proper systems to manage employee relations, development, and compliance.",
                  100,
                )}
              </div>
            </div>

            <div className="tracking-wider text-sm font-medium">4 / 20</div>
          </div>

          <LargeProgress progress={20} color="bg-orange-500" />
        </div>

        <div className="">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <BlackLink
                to={Paths.targetPath("3")}
                className="font-semibold decoration-stone-400 hover:decoration-black hover:text-black"
                underline="hover"
              >
                Operations Setup
              </BlackLink>

              <div className="text-xs text-content-dimmed mt-0.5">
                {truncateString(
                  "Establish efficient operational systems and procedures that align with company standards while accommodating local requirements. This ensures smooth daily operations and consistent service delivery.",
                  100,
                )}
              </div>
            </div>

            <div className="tracking-wider text-sm font-medium">4 / 8</div>
          </div>

          <LargeProgress progress={50} color="bg-accent-1" />
        </div>
      </div>

      <div className="mt-8" />

      {showForm ? (
        <Form hideForm={() => setShowForm(false)} />
      ) : (
        <SecondaryButton onClick={() => setShowForm(true)} size="xs">
          Add target
        </SecondaryButton>
      )}
    </Section>
  );
}

function Form({ hideForm }) {
  const form = Forms.useForm({
    fields: {
      name: "",
      type: "number",
      dueDate: "",
      from: "",
      to: "",
      unit: "",
      tasks: [newTask()],
      currency: "USD",
      description: null,
    },
    validate: (addError) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    submit: hideForm,
  });

  return (
    <Forms.Form form={form}>
      <div className="flex flex-col gap-2 p-4 border border-stroke-base  shadow-lg rounded">
        <Forms.FieldGroup>
          <Forms.TextInput label="Name" field="name" autoFocus placeholder="e.g. Monthly Reports" />
        </Forms.FieldGroup>

        <Forms.FieldGroup layout="grid">
          <Forms.SelectBox
            label="Type"
            field="type"
            options={[
              { value: "number", label: "Number" },
              { value: "currency", label: "Currency" },
              { value: "boolean", label: "Yes/No" },
              { value: "tasks", label: "Tasks" },
            ]}
          />

          <Forms.TextInput label="Due date (optional)" field="dueDate" autoFocus />
        </Forms.FieldGroup>

        <Forms.FieldGroup>
          <Forms.RichTextArea
            label="Description (optional)"
            height="60px"
            field="description"
            mentionSearchScope={{ type: "none" }}
          />
        </Forms.FieldGroup>

        <Fields />

        <Forms.Submit />
      </div>
    </Forms.Form>
  );
}

function Fields() {
  const [type] = Forms.useFieldValue<string>("type");

  switch (type) {
    case "number":
      return <NumberFields />;
    case "currency":
      return <CurrencyFields />;
    case "tasks":
      return <TasksFields />;
    default:
      return null;
  }
}

function NumberFields() {
  return (
    <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 3 }}>
      <Forms.TextInput label="Start" field="from" placeholder="15" />
      <Forms.TextInput label="Target" field="to" placeholder="30" />
      <Forms.SelectBox
        label="Unit"
        field="unit"
        options={[
          { value: "minutes", label: "Minutes" },
          { value: "seconds", label: "Seconds" },
          { value: "bugs", label: "Bugs" },
          { value: "issues", label: "Issues" },
        ]}
      />
    </Forms.FieldGroup>
  );
}

function CurrencyFields() {
  return (
    <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 3 }}>
      <Forms.TextInput label="Start" field="from" placeholder="15" />
      <Forms.TextInput label="Target" field="to" placeholder="30" />
      <Forms.SelectBox
        label="Currency"
        field="currency"
        options={[
          { value: "usd", label: "USD" },
          { value: "euro", label: "EUR" },
          { value: "real", label: "BRL" },
        ]}
      />
    </Forms.FieldGroup>
  );
}

function TasksFields() {
  const [tasks, setTasks] = Forms.useFieldValue<{ name: string }[]>("tasks");

  const add = React.useCallback(() => {
    setTasks([...tasks, newTask()]);
  }, [tasks, setTasks]);

  return (
    <Forms.FieldGroup>
      {tasks.map((_, i) => (
        <Forms.TextInput label={`Task ${i + 1}`} placeholder="e.g. Design landing pages" field={`tasks[${i}].name`} />
      ))}
      <AddTask onClick={add} />
    </Forms.FieldGroup>
  );
}

function AddTask({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-[-10px] flex justify-start">
      <SecondaryButton onClick={onClick}>
        <IconPlus size={16} />
      </SecondaryButton>
    </div>
  );
}

function LargeProgress({ progress, color }) {
  const outer = classNames("h-1.5 bg-stroke-base mt-2");
  const inner = classNames("h-1.5", color);

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
    </div>
  );
}

function newTask() {
  const key = Math.random();

  return {
    key: key,
    name: "",
  };
}
