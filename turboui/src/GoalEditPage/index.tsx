import { useForm } from "react-hook-form";
import { Page } from "../Page";
import { Textfield } from "../forms/Textfield";

interface GoalEditPageProps {
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

interface FormValues {
  name: string;
}

export function GoalEditPage({ initialName, onSave, onCancel }: GoalEditPageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid, touchedFields },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: { name: initialName },
  });

  function submit(data: FormValues) {
    onSave(data.name.trim());
  }

  return (
    <Page title={["Edit Goal"]} size="small">
      <form className="max-w-md mx-auto mt-12 space-y-8" onSubmit={handleSubmit(submit)}>
        <Textfield
          label="Goal Name"
          placeholder="Enter a goal name..."
          maxLength={100}
          autoFocus
          error={errors.name?.message}
          {...register("name", { required: "Goal name is required." })}
        />
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={!isDirty || !isValid}
          >
            Save
          </button>
        </div>
      </form>
    </Page>
  );
}
