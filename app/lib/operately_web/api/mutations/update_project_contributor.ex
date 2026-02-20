defmodule OperatelyWeb.Api.Mutations.UpdateProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Contributor, Permissions, Project}
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
    |> run(:contrib, fn ctx -> Contributor.get(ctx.me, id: ctx.attrs[:contrib_id], opts: [preload: :person]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.contrib.request_info.access_level, :can_edit) end)
    |> run(:contrib_project, fn ctx -> Project.get(ctx.contrib.person, id: ctx.contrib.project_id) end)
    |> run(:validate_can_edit_permissions, fn ctx -> validate_can_edit_permissions(ctx.contrib.request_info.access_level, ctx.contrib_project.request_info.access_level, ctx.attrs[:permissions]) end)
    |> run(:validate_permission_level, fn ctx -> validate_permission_level(ctx.contrib.request_info.access_level, ctx.attrs[:permissions]) end)
    |> run(:operation, fn ctx -> ProjectContributorEdited.run(ctx.me, ctx.contrib, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{contributor: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :contrib, _} -> {:error, :not_found}
      {:error, :contrib_project, _} -> {:error, :internal_server_error}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :validate_can_edit_permissions, _} -> {:error, :forbidden}
      {:error, :validate_permission_level, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    if inputs[:permissions] do
      {:ok, %{inputs | permissions: Binding.from_atom(inputs.permissions)}}
    else
      {:ok, inputs}
    end
  end

  # Validates that the caller can edit the contributor's permissions
  # The caller must have equal or higher access level than the contributor
  defp validate_can_edit_permissions(caller_access_level, contributor_access_level, new_permissions) do
    if new_permissions == nil do
      {:ok, :allowed}
    else
      if caller_access_level >= contributor_access_level do
        {:ok, :allowed}
      else
        {:error, :forbidden}
      end
    end
  end

  # Validates that the new permission level is not higher than the caller's permission level
  defp validate_permission_level(caller_access_level, new_member_access_level) do
    if new_member_access_level == nil do
      {:ok, :allowed}
    else
      if new_member_access_level <= caller_access_level do
        {:ok, :allowed}
      else
        {:error, :forbidden}
      end
    end
  end
end
