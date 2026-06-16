defmodule OperatelyWeb.Api.ResourceHubs.ParentScope do
  @moduledoc false

  import Ecto.Query

  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  def parse_hub_scope(inputs, opts \\ []) do
    hub_key = Keyword.get(opts, :hub_key, :resource_hub_id)
    space_key = Keyword.get(opts, :space_key, :space_id)
    project_key = Keyword.get(opts, :project_key, :project_id)
    optional? = Keyword.get(opts, :optional, false)

    hub_id = inputs[hub_key]
    space_id = inputs[space_key]
    project_id = inputs[project_key]

    cond do
      hub_id && (space_id || project_id) ->
        {:error, :bad_request}

      hub_id ->
        {:ok, %{id: hub_id}}

      space_id && project_id ->
        {:error, :bad_request}

      space_id ->
        {:ok, %{space_id: space_id}}

      project_id ->
        {:ok, %{project_id: project_id}}

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

  defp to_hub_id_result(nil), do: {:error, :not_found}
  defp to_hub_id_result(hub_id), do: {:ok, hub_id}
end
