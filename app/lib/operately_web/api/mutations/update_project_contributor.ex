defmodule OperatelyWeb.Api.Mutations.UpdateProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Permissions
  alias Operately.Projects.Contributor
  alias Operately.Operations.ProjectContributorEdited

  inputs do
    field? :contrib_id, :string, null: true
    field? :person_id, :string, null: true
    field? :responsibility, :string, null: true
    field? :permissions, :integer, null: true
    field? :role, :string, null: true
  end

  outputs do
    field? :contributor, :project_contributor, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:contrib, fn ctx -> Contributor.get(ctx.me, id: ctx.attrs[:contrib_id]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.contrib.request_info.access_level, :can_edit_contributors) end)
    |> run(:operation, fn ctx -> ProjectContributorEdited.run(ctx.me, ctx.contrib, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{contributor: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :contrib, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    if inputs[:person_id] == nil do
      {:ok, inputs}
    else
      {:ok, person_id} = decode_id(inputs[:person_id])
      {:ok, %{inputs | person_id: person_id}}
    end
  end
end
