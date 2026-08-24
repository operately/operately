defmodule OperatelyWeb.Api.Projects.DeleteContributor do
  @moduledoc """
  Removes a contributor from a project.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.Binding
  alias Operately.Projects.Contributor
  alias Operately.Projects.Permissions
  alias Operately.Projects.Project
  alias Operately.Operations.ProjectContributorRemoved

  inputs do
    field :contrib_id, :string, null: false
  end

  outputs do
    field :project_contributor, :project_contributor, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs[:contrib_id]) end)
    |> run(:contrib, fn ctx -> Contributor.get(ctx.me, id: ctx.id, opts: [preload: :person]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.contrib.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:contrib_access_level, fn ctx -> get_contributor_current_access_level(ctx.contrib) end)
    |> run(:validate_can_remove, fn ctx -> validate_can_remove(ctx.contrib.request_info.access_level, ctx.contrib_access_level) end)
    |> run(:operation, fn ctx -> ProjectContributorRemoved.run(ctx.me, ctx.contrib) end)
    |> run(:serialized, fn ctx -> {:ok, %{contributor: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :contrib, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :validate_can_remove, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp get_contributor_current_access_level(contributor) do
    access_level =
      case Project.get(contributor.person, id: contributor.project_id) do
        {:ok, project} -> project.request_info.access_level
        {:error, _} -> Binding.no_access()
      end

    {:ok, access_level}
  end

  # The caller must have equal or higher access than the contributor they remove.
  defp validate_can_remove(caller_access_level, contributor_access_level) do
    if caller_access_level >= contributor_access_level do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
