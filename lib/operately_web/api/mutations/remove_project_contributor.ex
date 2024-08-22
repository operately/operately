defmodule OperatelyWeb.Api.Mutations.RemoveProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectContributorRemoving

  inputs do
    field :contrib_id, :string
  end

  outputs do
    field :project_contributor, :project_contributor
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:contrib, fn ctx -> Projects.get_contributor_with_project_and_access_level(inputs.contrib_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.contrib.project.requester_access_level, :can_edit_contributors) end)
    |> run(:operation, fn ctx -> ProjectContributorRemoving.run(ctx.me, ctx.contrib) end)
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
