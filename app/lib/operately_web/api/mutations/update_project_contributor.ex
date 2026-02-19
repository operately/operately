defmodule OperatelyWeb.Api.Mutations.UpdateProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Permissions
  alias Operately.Projects.Contributor
  alias Operately.Operations.ProjectContributorEdited
  alias Operately.Access.Binding

  inputs do
    field :contrib_id, :string, null: false
    field? :person_id, :id, null: true

    field? :responsibility, :string, null: true
    field? :permissions, :access_options, null: true
    field? :role, :string, null: true
  end

  outputs do
    field :contributor, :project_contributor, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:contrib, fn ctx -> Contributor.get(ctx.me, id: ctx.attrs[:contrib_id]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.contrib.request_info.access_level, :can_edit) end)
    |> run(:validate_permission_level, fn ctx -> validate_permission_level(ctx.contrib.request_info.access_level, ctx.attrs.permissions) end)
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
      {:error, :validate_permission_level, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, %{inputs | permissions: Binding.from_atom(inputs.permissions)}}
  end

  defp validate_permission_level(caller_access_level, new_member_access_level) do
    if new_member_access_level <= caller_access_level do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
