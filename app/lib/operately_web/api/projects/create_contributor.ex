defmodule OperatelyWeb.Api.Projects.CreateContributor do
  @moduledoc """
  Adds a contributor to a project.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Contributor, Project, Permissions}
  alias Operately.Access.Binding
  alias Operately.Repo

  inputs do
    field :project_id, :id, null: false
    field :person_id, :id, null: false

    field :responsibility, :string, null: false
    field :permissions, :access_options, null: false
    field :role, :project_contributor_role, null: true
  end

  outputs do
    field :project_contributor, :project_contributor, null: false
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, project} <- Project.get(me, id: inputs.project_id),
      {:ok, :allowed} <- Permissions.check(project.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
      {:ok, attrs} <- parse_inputs(inputs),
      {:ok, :allowed} <- validate_permission_level(project.request_info.access_level, attrs.permissions),
      {:ok, :allowed} <- ensure_not_already_contributor(attrs.project_id, attrs.person_id),
      {:ok, contributor} <- Operately.Operations.ProjectContributorAddition.run(me, attrs)
    ) do
      {:ok, %{project_contributor: Serializer.serialize(contributor, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :already_contributor} -> {:error, :bad_request, already_contributor_message()}
      {:error, %Ecto.Changeset{} = changeset} -> map_changeset_error(changeset)
      {:error, :contributor, %Ecto.Changeset{} = changeset, _} -> map_changeset_error(changeset)
    end
  end

  defp parse_inputs(inputs) do
    {:ok, %{
      project_id: inputs.project_id,
      person_id: inputs.person_id,
      responsibility: inputs.responsibility,
      permissions: Binding.from_atom(inputs.permissions),
      role: inputs.role
    }}
  end

  defp validate_permission_level(caller_access_level, new_member_access_level) do
    if new_member_access_level <= caller_access_level do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end

  defp ensure_not_already_contributor(project_id, person_id) do
    case Repo.get_by(Contributor, project_id: project_id, person_id: person_id) do
      nil -> {:ok, :allowed}
      _contributor -> {:error, :already_contributor}
    end
  end

  defp unique_person_project_error?(%Ecto.Changeset{errors: errors}) do
    Enum.any?(errors, fn
      {:project_id, {_, opts}} -> opts[:constraint] == :unique
      {:person_id, {_, opts}} -> opts[:constraint] == :unique
      _ -> false
    end)
  end

  defp map_changeset_error(changeset) do
    if unique_person_project_error?(changeset) do
      {:error, :bad_request, already_contributor_message()}
    else
      {:error, :bad_request}
    end
  end

  defp already_contributor_message, do: "This person is already a contributor on this project"
end
