defmodule Operately.Search.Sources.ResourceHub.Metadata do
  @moduledoc false

  import Ecto.Query

  alias Operately.Access.Context
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Search.Source
  alias Operately.Search.Sources.ResourceHub.Record

  def load(hub_ids) do
    hubs = ResourceHub |> load_records(hub_ids) |> Map.values()
    spaces = load_records(Group, Enum.map(hubs, & &1.space_id))
    projects = load_records(Project, Enum.map(hubs, & &1.project_id))
    goals = load_records(Goal, Enum.map(hubs, & &1.goal_id))
    contexts = load_contexts(spaces, projects, goals)

    Map.new(hubs, fn hub ->
      {hub.id, build(hub, spaces, projects, goals, contexts)}
    end)
  end

  defp build(%ResourceHub{space_id: space_id} = hub, spaces, _projects, _goals, contexts) when not is_nil(space_id) do
    parent = Map.get(spaces, space_id)

    common(hub, parent, Map.get(contexts, {:space, space_id}), %{
      space_id: space_id,
      project_id: nil,
      goal_id: nil
    })
  end

  defp build(%ResourceHub{project_id: project_id} = hub, _spaces, projects, _goals, contexts) when not is_nil(project_id) do
    parent = Map.get(projects, project_id)

    common(hub, parent, Map.get(contexts, {:project, project_id}), %{
      space_id: parent && parent.group_id,
      project_id: project_id,
      goal_id: nil
    })
  end

  defp build(%ResourceHub{goal_id: goal_id} = hub, _spaces, _projects, goals, contexts) when not is_nil(goal_id) do
    parent = Map.get(goals, goal_id)

    common(hub, parent, Map.get(contexts, {:goal, goal_id}), %{
      space_id: parent && parent.group_id,
      project_id: nil,
      goal_id: goal_id
    })
  end

  defp common(hub, parent, context, scopes) do
    scopes
    |> Map.merge(%{
      company_id: parent && parent.company_id,
      access_context_id: context && context.id,
      resource_hub_id: hub.id,
      scope_updated_at: Record.latest_timestamp([hub.updated_at, parent && parent.updated_at, context && context.updated_at]),
      owning_parent_deleted?: is_nil(parent) or not is_nil(parent.deleted_at)
    })
  end

  defp load_records(_schema, []), do: %{}

  defp load_records(schema, ids) do
    ids = ids |> Enum.reject(&is_nil/1) |> Enum.uniq()

    schema
    |> where([record], record.id in ^ids)
    |> Source.lock_for_maintenance()
    |> Repo.all(with_deleted: true)
    |> Map.new(&{&1.id, &1})
  end

  defp load_contexts(spaces, projects, goals) do
    space_ids = Map.keys(spaces)
    project_ids = Map.keys(projects)
    goal_ids = Map.keys(goals)

    Context
    |> where(
      [context],
      context.group_id in ^space_ids or context.project_id in ^project_ids or context.goal_id in ^goal_ids
    )
    |> Source.lock_for_maintenance()
    |> Repo.all()
    |> Map.new(fn context -> {context_key(context), context} end)
  end

  defp context_key(%{group_id: id}) when not is_nil(id), do: {:space, id}
  defp context_key(%{project_id: id}) when not is_nil(id), do: {:project, id}
  defp context_key(%{goal_id: id}) when not is_nil(id), do: {:goal, id}
end
