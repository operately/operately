defmodule OperatelyWeb.Api.Mutations.RemoveProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Contributor
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectContributorRemoved

  inputs do
    field? :contrib_id, :string, null: true
  end

  outputs do
    field? :project_contributor, :project_contributor, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs[:contrib_id]) end)
    |> run(:contrib, fn ctx -> Contributor.get(ctx.me, id: ctx.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.contrib.request_info.access_level, :has_full_access) end)
    |> run(:operation, fn ctx -> ProjectContributorRemoved.run(ctx.me, ctx.contrib) end)
    |> run(:serialized, fn ctx -> {:ok, %{contributor: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :contrib, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
