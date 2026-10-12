defmodule Operately.Operations.CuratedTemplateInstantiation do
  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access.Binding
  alias Operately.CuratedTemplates.Template
  alias Operately.Operations.{GoalCreation, ProjectCreation, KpiCreation}
  alias Operately.ContextualDates.ContextualDate
  alias __MODULE__.ProjectChildren

  defmodule Result do
    def __api_typename__, do: "curated_template_instantiation"
    defstruct [:resource_type, :resource_id, :space_id]
  end

  def run(person, space, inputs) do
    creation(person, space, inputs)
    |> Repo.transaction()
    |> after_commit()
  end

  defp creation(person, space, inputs) do
    Multi.new()
    |> Multi.run(:template, fn _, _ ->
      case Repo.one(from t in Template, where: t.id == ^inputs.template_id and t.state == :published, lock: "FOR SHARE") do
        nil -> {:error, :not_found}
        template -> {:ok, template}
      end
    end)
    |> Multi.run(:settings_validation, fn _, %{template: template} -> validate_settings(template, inputs) end)
    |> Multi.merge(fn %{template: template} -> build_resource(person, space, template, inputs) end)
    |> Multi.run(:result, fn _, %{template: template} = changes ->
      {:ok, %Result{resource_type: template.type, resource_id: changes[template.type].id, space_id: space.id}}
    end)
  end

  defp validate_settings(template, inputs) do
    cond do
      template.type != :kpi and not is_struct(inputs[:start_date], Date) -> {:error, :bad_request}
      inputs[:champion_id] && inputs[:champion_id] == inputs[:reviewer_id] -> {:error, :bad_request}
      template.type == :kpi and inputs[:reviewer_id] != nil -> {:error, :bad_request}
      true -> {:ok, :valid}
    end
  end

  defp build_resource(person, space, template, inputs) do
    definition = template.definition

    attrs = %{
      name: definition["name"],
      description: definition["description"],
      space_id: space.id,
      champion_id: inputs[:champion_id],
      reviewer_id: inputs[:reviewer_id],
      anonymous_access_level: Binding.no_access(),
      company_access_level: space.access_levels.company,
      space_access_level: max(Binding.comment_access(), space.access_levels.company)
    }

    case template.type do
      :goal ->
        targets = Enum.map(definition["targets"] || [], fn target -> Map.new([:name, :unit, :from, :to], fn key -> {key, target[Atom.to_string(key)]} end) end)
        GoalCreation.build(person, Map.merge(attrs, %{targets: targets, timeframe: timeframe(inputs.start_date, definition["duration_days"])}), %{})

      :project ->
        params =
          struct!(
            ProjectCreation,
            Map.drop(attrs, [:space_id])
            |> Map.merge(%{
              company_id: person.company_id,
              group_id: space.id,
              creator_id: person.id,
              visibility: "everyone",
              creator_role: "Contributor",
              timeframe: timeframe(inputs.start_date, definition["duration_days"])
            })
          )

        ProjectCreation.build(params)
        |> Multi.merge(fn %{project: project} -> ProjectChildren.build(project, definition, inputs.start_date) end)

      :kpi ->
        KpiCreation.build(person, Map.merge(attrs, %{unit: definition["unit"], cadence: definition["cadence"]}))
    end
  end

  defp timeframe(start_date, duration) do
    %{contextual_start_date: ContextualDate.create_day_date(start_date), contextual_end_date: contextual_offset(start_date, duration)}
  end

  defp contextual_offset(_, nil), do: nil
  defp contextual_offset(start_date, days), do: ContextualDate.create_day_date(Date.add(start_date, days))

  defp after_commit({:ok, %{result: result} = changes}) do
    if changes[:kpi], do: KpiCreation.broadcast_assignments_count({:ok, changes.kpi})
    {:ok, result}
  end

  defp after_commit({:error, _, reason, _}), do: {:error, reason}

  defmodule ProjectChildren do
    alias Ecto.Multi
    alias Operately.Projects.{Milestone, Project}
    alias Operately.Tasks.Task
    alias OperatelyWeb.Paths
    alias Operately.Operations.ProjectTemplateMaterialization.ChildrenCreator

    def build(project, definition, start_date) do
      milestones = Enum.map(definition["milestones"] || [], &%{source: &1, target: %Milestone{id: Ecto.UUID.generate(), title: &1["title"]}})
      milestone_ids = Map.new(milestones, &{&1.source["key"], &1.target.id})

      tasks =
        Enum.map(definition["tasks"] || [], fn source ->
          %{
            source: %Task{name: source["name"], description: source["description"] || %{"type" => "doc", "content" => []}, reminders: [], task_status: hd(project.task_statuses)},
            target: %Task{id: Ecto.UUID.generate(), name: source["name"], milestone_id: milestone_ids[source["milestone_key"]]},
            due_date: offset(start_date, source["due_offset_days"])
          }
        end)

      milestones =
        Enum.map(milestones, fn planned ->
          milestone_tasks = Enum.filter(tasks, &(&1.target.milestone_id == planned.target.id))

          %{
            source: %Milestone{title: planned.source["title"]},
            target: planned.target,
            due_date: offset(start_date, planned.source["due_offset_days"]),
            tasks_ordering_state: Enum.map(milestone_tasks, &Paths.task_id(&1.target)),
            tasks_kanban_state: kanban(milestone_tasks)
          }
        end)

      plan = %{milestones: milestones, tasks: tasks, task_statuses: Enum.map(project.task_statuses, &Map.from_struct/1)}

      Multi.new()
      |> Multi.run(:children, fn repo, _ -> ChildrenCreator.insert_work_items(repo, plan, project) end)
      |> Multi.update(
        :project_ordering,
        Project.changeset(project, %{
          milestones_ordering_state: Enum.map(milestones, &Paths.milestone_id(&1.target)),
          tasks_kanban_state: tasks |> Enum.filter(&is_nil(&1.target.milestone_id)) |> kanban()
        })
      )
    end

    defp kanban(tasks) do
      Operately.Tasks.KanbanState.initialize() |> Map.put("pending", Enum.map(tasks, &Paths.task_id(&1.target)))
    end

    defp offset(_, nil), do: nil
    defp offset(start_date, days), do: Date.add(start_date, days)
  end
end
