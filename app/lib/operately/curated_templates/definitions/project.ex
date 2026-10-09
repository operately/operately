defmodule Operately.CuratedTemplates.Definitions.Project do
  use Ecto.Schema
  import Ecto.Changeset
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :name, :string
    field :description, :map
    field :duration_days, :integer
    embeds_many :milestones, Definitions.Milestone, on_replace: :delete
    embeds_many :tasks, Definitions.Task, on_replace: :delete
  end

  def changeset(schema, attrs, mode) do
    schema
    |> Definitions.cast_fields(attrs, [:name, :description, :duration_days], [:name], mode)
    |> Definitions.description()
    |> Definitions.nonnegative(:duration_days)
    |> cast_embed(:milestones, with: &Definitions.Milestone.changeset(&1, &2, mode))
    |> Definitions.limit_children(:milestones)
    |> cast_embed(:tasks, with: &Definitions.Task.changeset(&1, &2, mode))
    |> Definitions.limit_children(:tasks)
    |> validate_references()
  end

  defp validate_references(cs) do
    milestones = get_field(cs, :milestones, [])
    tasks = get_field(cs, :tasks, [])
    keys = Enum.map(milestones, & &1.key)

    cs =
      Enum.reduce([milestones: milestones, tasks: tasks], cs, fn {field, children}, acc ->
        keys = children |> Enum.map(& &1.key) |> Enum.reject(&is_nil/1)
        if Enum.uniq(keys) == keys, do: acc, else: add_error(acc, field, "is invalid")
      end)

    tasks
    |> Enum.with_index()
    |> Enum.reduce(cs, fn {task, index}, acc ->
      if is_nil(task.milestone_key) or task.milestone_key in keys,
        do: acc,
        else: add_error(acc, :tasks, "is invalid", path: "tasks.#{index}.milestone_key")
    end)
  end
end
