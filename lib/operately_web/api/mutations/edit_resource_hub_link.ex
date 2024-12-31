defmodule OperatelyWeb.Api.Mutations.EditResourceHubLink do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Link, Permissions}
  alias Operately.Operations.ResourceHubLinkEditing

  inputs do
    field :link_id, :id
    field :name, :string
    field :type, :string
    field :url, :string
    field :description, :string
  end

  outputs do
    field :link, :resource_hub_link
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_attrs(inputs) end)
    |> run(:link, fn ctx -> find_link(ctx) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.link.request_info.access_level, :can_edit_link) end)
    |> run(:operation, fn ctx -> ResourceHubLinkEditing.run(ctx.me, ctx.link, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{link: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :link, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_attrs(inputs) do
    description = Jason.decode!(inputs.description)
    {:ok, Map.put(inputs, :description, description)}
  end

  defp find_link(ctx) do
    Link.get(ctx.me, id: ctx.attrs.link_id, opts: [preload: [:node, :resource_hub]])
  end
end
