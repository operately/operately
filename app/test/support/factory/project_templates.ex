defmodule Operately.Support.Factory.ProjectTemplates do
  alias Operately.ProjectTemplates.{Milestone, ProjectTemplate, Task}
  alias Operately.Repo
  alias Operately.Support.Factory.Utils

  def add_project_template(ctx, testid, space_name, opts \\ []) do
    source_project = Keyword.get(opts, :source_project)

    attrs = %{
      company_id: ctx.company.id,
      space_id: ctx[space_name].id,
      creator_id: ctx[Keyword.get(opts, :creator, :creator)].id,
      source_project_id: source_project && ctx[source_project].id,
      name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
      description: Keyword.get(opts, :description, %{}),
      duration_days: Keyword.get(opts, :duration_days)
    }

    template = attrs |> ProjectTemplate.changeset() |> Repo.insert!()
    Map.put(ctx, testid, template)
  end

  def add_project_template_milestone(ctx, testid, template_name, opts \\ []) do
    attrs = %{
      project_template_id: ctx[template_name].id,
      title: Keyword.get(opts, :title, Utils.testid_to_name(testid)),
      description: Keyword.get(opts, :description, %{}),
      due_offset_days: Keyword.get(opts, :due_offset_days)
    }

    milestone = attrs |> Milestone.changeset() |> Repo.insert!()
    Map.put(ctx, testid, milestone)
  end

  def add_project_template_task(ctx, testid, template_name, opts \\ []) do
    milestone = Keyword.get(opts, :milestone)

    attrs =
      %{
        project_template_id: ctx[template_name].id,
        project_template_milestone_id: milestone && ctx[milestone].id,
        name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
        description: Keyword.get(opts, :description, %{}),
        priority: Keyword.get(opts, :priority),
        size: Keyword.get(opts, :size),
        due_offset_days: Keyword.get(opts, :due_offset_days)
      }
      |> maybe_put(:reminders, Keyword.get(opts, :reminders))
      |> maybe_put(:task_status, Keyword.get(opts, :task_status))

    task = attrs |> Task.changeset() |> Repo.insert!()
    Map.put(ctx, testid, task)
  end

  defp maybe_put(attrs, _key, nil), do: attrs
  defp maybe_put(attrs, key, value), do: Map.put(attrs, key, value)
end
