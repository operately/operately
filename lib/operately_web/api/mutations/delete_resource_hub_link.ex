defmodule OperatelyWeb.Api.Mutations.DeleteResourceHubLink do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Link, Permissions}
  alias Operately.Operations.ResourceHubLinkDeleting

  inputs do
    field :link_id, :id
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:link, fn ctx -> find_link(ctx.me, inputs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.link.request_info.access_level, :can_delete_link) end)
    |> run(:operation, fn ctx -> ResourceHubLinkDeleting.run(ctx.me, ctx.link) end)
    |> run(:result, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.result}
      {:error, :link, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp find_link(me, inputs) do
    Link.get(me, id: inputs.link_id, opts: [preload: [:node, :resource_hub]])
  end
end
