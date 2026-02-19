defmodule OperatelyWeb.Api.Mutations.AddProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Project, Permissions}

  inputs do
    field :project_id, :id
    field :person_id, :id

    field? :responsibility, :string, null: true
    field? :permissions, :integer, null: true
    field? :role, :string, null: true
  end

  outputs do
    field? :project_contributor, :project_contributor, null: true
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, project} <- Project.get(me, id: inputs.project_id),
      {:ok, :allowed} <- Permissions.check(project.request_info.access_level, :can_edit),
      {:ok, contributor} <- Operately.Operations.ProjectContributorAddition.run(me, inputs)
    ) do
      {:ok, %{contributor: Serializer.serialize(contributor, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
    end
  end
end
