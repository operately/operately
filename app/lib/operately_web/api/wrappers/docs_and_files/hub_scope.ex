defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope do
  @moduledoc false

  use Gettext, backend: OperatelyWeb.Gettext

  alias Operately.Groups.Group
  alias Operately.ResourceHubs.{Folder, ResourceHub}
  alias OperatelyWeb.Api.Serializer

  def resolve_hub_id(me, inputs) do
    with :ok <- validate_selectors(inputs),
         {:ok, parent} <- load_parent(me, inputs),
         {:ok, explicit_hub} <- load_explicit_hub(me, inputs[:resource_hub_id]),
         {:ok, folder_hub} <- load_folder_hub(me, inputs[:folder_id]),
         {:ok, hub} <- select_hub(me, parent, explicit_hub, folder_hub),
         :ok <- validate_parent(hub, parent) do
      {:ok, hub.id}
    end
  end

  def validate_selectors(inputs) do
    parents = Enum.count([:space_id, :project_id, :goal_id], &inputs[&1])
    selected? = Enum.any?([:space_id, :project_id, :goal_id, :resource_hub_id, :folder_id], &inputs[&1])
    if selected? and parents <= 1, do: :ok, else: {:error, :bad_request}
  end

  def to_resource_hub_inputs(me, inputs) do
    with {:ok, hub_id} <- resolve_hub_id(me, inputs) do
      {:ok, inputs |> Map.put(:resource_hub_id, hub_id) |> Map.drop([:space_id, :project_id, :goal_id])}
    end
  end

  def with_resolved_hub({:ok, result}, hub_id) do
    {:ok, Map.put(result, :resource_hub_id, OperatelyWeb.Paths.resource_hub_id(hub_id))}
  end

  def with_resolved_hub(error, _hub_id), do: error

  defp load_parent(me, inputs) do
    parents = Enum.filter([:space_id, :project_id, :goal_id], &inputs[&1])

    case parents do
      [] -> {:ok, nil}
      [:space_id] -> load_parent_resource(Group, me, :space_id, inputs.space_id)
      [:project_id] -> load_parent_resource(Operately.Projects.Project, me, :project_id, inputs.project_id)
      [:goal_id] -> load_parent_resource(Operately.Goals.Goal, me, :goal_id, inputs.goal_id)
      _ -> {:error, :bad_request}
    end
  end

  defp load_parent_resource(module, me, key, id) do
    with {:ok, resource} <- module.get(me, id: id), do: {:ok, {key, resource}}
  end

  defp load_explicit_hub(_me, nil), do: {:ok, nil}
  defp load_explicit_hub(me, id), do: ResourceHub.get(me, id: id)

  defp load_folder_hub(_me, nil), do: {:ok, nil}

  defp load_folder_hub(me, id) do
    with {:ok, folder} <- Folder.get(me, id: id, opts: [preload: :node]) do
      ResourceHub.get(me, id: folder.node.resource_hub_id)
    end
  end

  defp select_hub(_me, _parent, %{id: id}, %{id: other_id}) when id != other_id, do: {:error, :bad_request}
  defp select_hub(_me, _parent, _explicit, %ResourceHub{} = folder_hub), do: {:ok, folder_hub}
  defp select_hub(_me, _parent, %ResourceHub{} = explicit, nil), do: {:ok, explicit}
  defp select_hub(_me, nil, nil, nil), do: {:error, :bad_request}

  defp select_hub(me, {:space_id, space}, nil, nil) do
    case load_explicit_hub(me, space.default_resource_hub_id) do
      {:ok, %ResourceHub{space_id: space_id} = hub} when space_id == space.id -> {:ok, hub}
      _ -> unavailable_default(me, space)
    end
  end

  defp select_hub(me, {key, parent}, nil, nil) do
    case ResourceHub.list(me, [{key, parent.id}, {:opts, [order_by: [asc: :inserted_at, asc: :id]]}]) do
      [hub | _] -> {:ok, hub}
      [] -> {:error, :not_found}
    end
  end

  defp validate_parent(_hub, nil), do: :ok

  defp validate_parent(hub, {key, parent}) do
    if Map.fetch!(hub, key) == parent.id, do: :ok, else: {:error, :bad_request}
  end

  defp unavailable_default(me, space) do
    {:error, :bad_request, gettext("This space has no available default resource hub. Retry with resource_hub_id from the available hubs."),
     %{code: "default_resource_hub_unavailable", candidates: Serializer.serialize(Operately.ResourceHubs.list_summaries(me, space))}}
  end
end
