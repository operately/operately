defmodule Operately.ProjectTemplates.Task do
  use Operately.Schema

  alias Operately.ProjectTemplates.{Milestone, ProjectTemplate}
  alias Operately.Tasks.{Reminder, Status}

  schema "project_template_tasks" do
    belongs_to :project_template, ProjectTemplate
    belongs_to :project_template_milestone, Milestone

    field :name, :string
    field :description, :map
    field :priority, :string
    field :size, :string
    field :due_offset_days, :integer

    embeds_many :reminders, Reminder, on_replace: :delete
    embeds_one :task_status, Status, on_replace: :update

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(task, attrs) do
    task
    |> cast(attrs, [
      :project_template_id,
      :project_template_milestone_id,
      :name,
      :description,
      :priority,
      :size,
      :due_offset_days
    ])
    |> cast_embed(:reminders)
    |> cast_embed(:task_status)
    |> put_default_task_status()
    |> validate_due_relative_reminders()
    |> validate_required([:project_template_id, :name, :description])
    |> validate_number(:due_offset_days, greater_than_or_equal_to: 0)
    |> check_constraint(:due_offset_days, name: :project_template_tasks_due_offset_days_non_negative)
  end

  defp put_default_task_status(changeset) do
    case get_field(changeset, :task_status) do
      nil -> put_embed(changeset, :task_status, Status.default_task_status())
      _status -> changeset
    end
  end

  defp validate_due_relative_reminders(changeset) do
    reminders = get_field(changeset, :reminders, [])

    if Enum.all?(reminders, &Reminder.due_relative?/1) do
      changeset
    else
      add_error(changeset, :reminders, "must be relative to the task due date")
    end
  end
end
