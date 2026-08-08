defmodule Operately.Support.Factory.ProjectTemplates do
  alias Operately.ProjectTemplates.{Milestone, Person, ProjectTemplate, Task, TaskAssignment}
  alias Operately.Repo
  alias Operately.Support.Factory.Utils

  def add_project_template(ctx, testid, space_name, opts \\ []) do
    source_project = Keyword.get(opts, :source_project)

    attrs =
      %{
        company_id: ctx.company.id,
        space_id: ctx[space_name].id,
        creator_id: ctx[Keyword.get(opts, :creator, :creator)].id,
        source_project_id: source_project && ctx[source_project].id,
        name: Keyword.get(opts, :name, Utils.testid_to_name(testid)),
        description: Keyword.get(opts, :description, %{}),
        duration_days: Keyword.get(opts, :duration_days),
        task_statuses: Keyword.get(opts, :task_statuses),
        milestones_ordering_state: Keyword.get(opts, :milestones_ordering_state),
        tasks_kanban_state: Keyword.get(opts, :tasks_kanban_state)
      }
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    template = attrs |> ProjectTemplate.changeset() |> Repo.insert!()
    Map.put(ctx, testid, template)
  end

  def add_project_template_milestone(ctx, testid, template_name, opts \\ []) do
    attrs =
      %{
        project_template_id: ctx[template_name].id,
        title: Keyword.get(opts, :title, Utils.testid_to_name(testid)),
        description: Keyword.get(opts, :description, %{}),
        due_offset_days: Keyword.get(opts, :due_offset_days),
        tasks_ordering_state: Keyword.get(opts, :tasks_ordering_state),
        tasks_kanban_state: Keyword.get(opts, :tasks_kanban_state)
      }
      |> Enum.reject(fn {_key, value} -> is_nil(value) end)
      |> Map.new()

    milestone = attrs |> Milestone.changeset() |> Repo.insert!()
    Map.put(ctx, testid, milestone)
  end

  def add_project_template_task(ctx, testid, template_name, opts \\ []) do
    milestone = Keyword.get(opts, :milestone)
    task_status = task_status(ctx, template_name, opts)

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
      |> maybe_put(:task_status, task_status)

    task = attrs |> Task.changeset() |> Repo.insert!()
    Map.put(ctx, testid, task)
  end

  def add_project_template_person(ctx, testid, template_name, person_name, opts \\ []) do
    attrs = %{
      project_template_id: ctx[template_name].id,
      person_id: ctx[person_name].id,
      role: Keyword.get(opts, :role, :contributor),
      responsibility: Keyword.get(opts, :responsibility),
      access_level: Keyword.get(opts, :access_level, Operately.Access.Binding.view_access())
    }

    person = attrs |> Person.changeset() |> Repo.insert!()
    Map.put(ctx, testid, person)
  end

  def add_project_template_task_assignment(ctx, testid, template_name, task_name, person_name) do
    assignment =
      %{
        project_template_id: ctx[template_name].id,
        project_template_task_id: ctx[task_name].id,
        project_template_person_id: ctx[person_name].id
      }
      |> TaskAssignment.changeset()
      |> Repo.insert!()

    Map.put(ctx, testid, assignment)
  end

  defp maybe_put(attrs, _key, nil), do: attrs
  defp maybe_put(attrs, key, value), do: Map.put(attrs, key, value)

  defp task_status(ctx, template_name, opts) do
    Keyword.get(opts, :task_status) || Map.from_struct(List.first(ctx[template_name].task_statuses))
  end
end
