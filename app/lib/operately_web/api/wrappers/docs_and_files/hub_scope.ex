defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope do
  @moduledoc false

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  def resolve_hub_id(me, inputs, opts \\ []) do
    with {:ok, scope} <- parse_hub_scope(inputs, opts),
         {:ok, hub} <- get_resource_hub(me, scope) do
      {:ok, hub.id}
    end
  end

  def resolve_filter(me, inputs) do
    cond do
      not is_nil(inputs[:folder_id]) ->
        {:ok, %{folder_id: inputs.folder_id}}

      inputs[:resource_hub_id] && (inputs[:space_id] || inputs[:project_id] || inputs[:goal_id]) ->
        {:error, :bad_request}

      not is_nil(inputs[:resource_hub_id]) ->
        {:ok, %{resource_hub_id: inputs.resource_hub_id}}

      true ->
        case resolve_hub_id(me, inputs) do
          {:ok, hub_id} -> {:ok, %{resource_hub_id: hub_id}}
          error -> error
        end
    end
  end

  def to_resource_hub_inputs(me, inputs, opts \\ []) do
    with {:ok, hub_id} <- resolve_hub_id(me, inputs, opts) do
      {:ok,
       inputs
       |> Map.put(:resource_hub_id, hub_id)
       |> Map.drop([:space_id, :project_id, :goal_id])}
    end
  end

  def parse_hub_scope(inputs, opts \\ []) do
    hub_key = Keyword.get(opts, :hub_key, :resource_hub_id)
    space_key = Keyword.get(opts, :space_key, :space_id)
    project_key = Keyword.get(opts, :project_key, :project_id)
    goal_key = Keyword.get(opts, :goal_key, :goal_id)
    optional? = Keyword.get(opts, :optional, false)

    hub_id = inputs[hub_key]
    space_id = inputs[space_key]
    project_id = inputs[project_key]
    goal_id = inputs[goal_key]
    parent_ids = Enum.filter([space_id, project_id, goal_id], & &1)

    cond do
      hub_id && parent_ids != [] ->
        {:error, :bad_request}

      hub_id ->
        {:ok, %{id: hub_id}}

      length(parent_ids) > 1 ->
        {:error, :bad_request}

      space_id ->
        {:ok, %{space_id: space_id}}

      project_id ->
        {:ok, %{project_id: project_id}}

      goal_id ->
        {:ok, %{goal_id: goal_id}}

      optional? ->
        {:ok, nil}

      true ->
        {:error, :bad_request}
    end
  end

  def get_resource_hub(me, scope, opts \\ [])

  def get_resource_hub(me, %{id: hub_id}, opts) do
    ResourceHub.get(me, Keyword.merge(opts, id: hub_id))
  end

  def get_resource_hub(me, %{space_id: space_id}, opts) do
    with {:ok, hub_id} <- hub_id_for_parent(space_id: space_id) do
      ResourceHub.get(me, Keyword.merge(opts, id: hub_id))
    end
  end

  def get_resource_hub(me, %{project_id: project_id}, opts) do
    with {:ok, hub_id} <- hub_id_for_parent(project_id: project_id) do
      ResourceHub.get(me, Keyword.merge(opts, id: hub_id))
    end
  end

  def get_resource_hub(me, %{goal_id: goal_id}, opts) do
    with {:ok, hub_id} <- hub_id_for_parent(goal_id: goal_id) do
      ResourceHub.get(me, Keyword.merge(opts, id: hub_id))
    end
  end

  defp hub_id_for_parent(space_id: space_id) do
    from(h in ResourceHub,
      where: h.space_id == ^space_id,
      order_by: [asc: h.inserted_at],
      limit: 1,
      select: h.id
    )
    |> Repo.one()
    |> to_hub_id_result()
  end

  defp hub_id_for_parent(project_id: project_id) do
    from(h in ResourceHub,
      where: h.project_id == ^project_id,
      order_by: [asc: h.inserted_at],
      limit: 1,
      select: h.id
    )
    |> Repo.one()
    |> to_hub_id_result()
  end

  defp hub_id_for_parent(goal_id: goal_id) do
    from(h in ResourceHub,
      where: h.goal_id == ^goal_id,
      order_by: [asc: h.inserted_at],
      limit: 1,
      select: h.id
    )
    |> Repo.one()
    |> to_hub_id_result()
  end

  defp to_hub_id_result(nil), do: {:error, :not_found}
  defp to_hub_id_result(hub_id), do: {:ok, hub_id}
end
