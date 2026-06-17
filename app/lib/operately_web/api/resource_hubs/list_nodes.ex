defmodule OperatelyWeb.Api.ResourceHubs.ListNodes do
  @moduledoc """
  Lists nodes in a resource hub or folder.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.{Binding, Context}
  alias Operately.ResourceHubs.{Folder, Node}

  inputs do
    field? :resource_hub_id, :id, null: true
    field? :folder_id, :id, null: true
    field? :include_comments_count, :boolean, null: true
    field? :include_children_count, :boolean, null: true
  end

  outputs do
    field :nodes, list_of(:resource_hub_node), null: false
    field :draft_nodes, list_of(:resource_hub_node), null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:filter, fn _ctx -> resolve_filter_inputs(inputs) end)
    |> run(:nodes, fn ctx -> load_nodes(ctx.me, ctx.filter, inputs) end)
    |> run(:serialized, fn ctx -> serialize(ctx.nodes) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :filter, %{error: :bad_request}} -> {:error, :bad_request}
      {:error, :filter, _} -> {:error, :not_found}
      {:error, :nodes, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp resolve_filter_inputs(inputs) do
    cond do
      not is_nil(inputs[:folder_id]) ->
        {:ok, %{folder_id: inputs.folder_id}}

      not is_nil(inputs[:resource_hub_id]) ->
        {:ok, %{resource_hub_id: inputs.resource_hub_id}}

      true ->
        {:error, :bad_request}
    end
  end

  defp load_nodes(me, filter_inputs, inputs) do
    nodes =
      from(n in Node,
        left_join: hub in assoc(n, :resource_hub), as: :hub,
        left_join: project in assoc(hub, :project), as: :project,
        left_join: space in assoc(hub, :space), as: :space,
        order_by: [desc: n.inserted_at]
      )
      |> filter_nodes(filter_inputs)
      |> Node.preload_content(me)
      |> filter_by_parent_view_access(me.id)
      |> Repo.all()
      |> load_comments_count(inputs[:include_comments_count])
      |> set_folders_children_count(inputs[:include_children_count])

    {:ok, nodes}
  end

  defp serialize(nodes) do
    {drafts, published} = Node.separate_drafts(nodes)

    {:ok, %{
      nodes: Serializer.serialize(published, level: :essential),
      draft_nodes: Serializer.serialize(drafts, level: :essential)
    }}
  end

  defp filter_nodes(q, %{resource_hub_id: resource_hub_id}) do
    from(n in q, where: n.resource_hub_id == ^resource_hub_id and is_nil(n.parent_folder_id))
  end

  defp filter_nodes(q, %{folder_id: folder_id}) do
    from(n in q, where: n.parent_folder_id == ^folder_id)
  end

  defp load_comments_count(nodes, true), do: Node.load_comments_count(nodes)
  defp load_comments_count(nodes, _), do: nodes

  defp set_folders_children_count(nodes, true), do: Folder.set_children_count(nodes)
  defp set_folders_children_count(nodes, _), do: nodes

  defp filter_by_parent_view_access(query, requester_id) do
    from([project: project, space: space] in query,
      join: context in Context,
      on: context.project_id == project.id or context.group_id == space.id,
      join: binding in assoc(context, :bindings),
      join: access_group in assoc(binding, :group),
      join: membership in assoc(access_group, :memberships),
      join: person in assoc(membership, :person),
      where: membership.person_id == ^requester_id,
      where: is_nil(person.suspended_at),
      where: binding.access_level >= ^Binding.view_access(),
      distinct: true
    )
  end
end
