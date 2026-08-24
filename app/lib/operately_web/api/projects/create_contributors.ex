defmodule OperatelyWeb.Api.Projects.CreateContributors do
  @moduledoc """
  Adds multiple contributors to a project.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Project
  alias Operately.Projects.Permissions
  alias Operately.Access.Binding
  alias Operately.Operations.ProjectContributorsAddition, as: Operation

  inputs do
    field :project_id, :id, null: false
    field :contributors, list_of(:project_contributor_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:contribs, fn -> decode_contributors(inputs.contributors) end)
    |> run(:project, fn ctx -> Project.get(ctx.me, id: inputs.project_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:validate_permission_levels, fn ctx -> validate_permission_levels(ctx.project.request_info.access_level, ctx.contribs) end)
    |> run(:operation, fn ctx -> Operation.run(ctx.me, ctx.project, ctx.contribs) end)
    |> run(:serialized, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :me, _} -> {:error, :unauthorized}
      {:error, :project_id, _} -> {:error, :bad_request}
      {:error, :contribs, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :validate_permission_levels, _} -> {:error, :forbidden}
      {:error, :operation, %{error: %Ecto.Changeset{} = changeset}} -> map_changeset_error(changeset)
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp map_changeset_error(changeset) do
    if unique_person_project_error?(changeset) do
      {:error, :bad_request, "This person is already a contributor on this project"}
    else
      {:error, :bad_request}
    end
  end

  defp unique_person_project_error?(%Ecto.Changeset{errors: errors}) do
    Enum.any?(errors, fn
      {:project_id, {_, opts}} -> opts[:constraint] == :unique
      {:person_id, {_, opts}} -> opts[:constraint] == :unique
      _ -> false
    end)
  end

  defp decode_contributors(contribs), do: decode_contributors(contribs, [])

  defp decode_contributors([], acc), do: {:ok, acc}

  defp decode_contributors([contrib| rest], acc) do
    {:ok, contrib} = decode_contributor(contrib)
    decode_contributors(rest, [contrib | acc])
  end

  defp decode_contributor(contributor) do
    {:ok, Map.merge(contributor, %{access_level: Binding.from_atom(contributor.access_level), role: :contributor})}
  end

  defp validate_permission_levels(caller_access_level, contributors) do
    if Enum.all?(contributors, fn contrib -> contrib.access_level <= caller_access_level end) do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
