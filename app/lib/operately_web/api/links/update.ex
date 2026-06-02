defmodule OperatelyWeb.Api.Links.Update do
  @moduledoc """
  Updates a link.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Link, Permissions}
  alias Operately.Operations.ResourceHubLinkEditing

  inputs do
    field :link_id, :id, null: false
    field :name, :string, null: false
    field :type, :resource_hub_link_type, null: false
    field :url, :string, null: false
    field? :description, :json, null: false
  end

  outputs do
    field :link, :resource_hub_link, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:link, fn ctx -> find_link(ctx, inputs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.link.request_info.access_level, :can_edit_link, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ResourceHubLinkEditing.run(ctx.me, ctx.link, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{link: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :link, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp find_link(ctx, inputs) do
    Link.get(ctx.me, id: inputs.link_id, opts: [preload: [:node, :resource_hub]])
  end
end
