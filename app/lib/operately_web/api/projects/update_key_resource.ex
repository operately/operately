defmodule OperatelyWeb.Api.Projects.UpdateKeyResource do
  @moduledoc """
  Updates a project key resource.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.{Permissions, KeyResource}

  inputs do
    field :id, :id, null: false
    field :title, :string, null: false
    field :link, :string, null: false
  end

  outputs do
    field :key_resource, :project_key_resource, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:resource, fn ctx -> fetch_key_resource(ctx, inputs) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.resource.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> Projects.update_key_resource(ctx.resource, inputs) end)
    |> run(:serialized, fn ctx -> serialize(ctx.operation) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :resource, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_key_resource(ctx, inputs) do
    KeyResource.get(ctx.me, id: inputs.id, opts: [preload: :project])
  end

  def serialize(resource) do
    resource = Repo.preload(resource, :project)
    {:ok, %{key_resource: Serializer.serialize(resource)}}
  end
end
