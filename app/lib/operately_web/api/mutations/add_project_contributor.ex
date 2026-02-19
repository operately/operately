defmodule OperatelyWeb.Api.Mutations.AddProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Project, Permissions}
  alias Operately.Access.Binding

  inputs do
    field :project_id, :id
    field :person_id, :id

    field :responsibility, :string, null: false
    field :permissions, :access_options, null: false
    field :role, :string, null: true
  end

  outputs do
    field? :project_contributor, :project_contributor, null: true
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, project} <- Project.get(me, id: inputs.project_id),
      {:ok, :allowed} <- Permissions.check(project.request_info.access_level, :can_edit),
      {:ok, attrs} <- parse_inputs(inputs),
      {:ok, :allowed} <- validate_permission_level(project.request_info.access_level, attrs.permissions),
      {:ok, contributor} <- Operately.Operations.ProjectContributorAddition.run(me, attrs)
    ) do
      {:ok, %{contributor: Serializer.serialize(contributor, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
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
end
