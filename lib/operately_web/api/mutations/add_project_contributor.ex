defmodule OperatelyWeb.Api.Mutations.AddProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :project_id, :string
    field :person_id, :string
    field :responsibility, :string
    field :permissions, :integer
  end

  outputs do
    field :project_contributor, :project_contributor
  end

  def call(conn, inputs) do
    {:ok, project_id} = decode_id(inputs.project_id)
    {:ok, person_id} = decode_id(inputs.person_id)

    case check_permissions(me(conn), project_id) do
      {:error, reason} ->
        {:error, reason}

      :ok ->
        {:ok, contributor} = Operately.Operations.ProjectContributorAddition.run(me(conn), %{
          project_id: project_id,
          person_id: person_id,
          responsibility: inputs.responsibility,
          permissions: inputs.permissions,
        })
        {:ok, %{contributor: Serializer.serialize(contributor, level: :essential)}}
    end
  end

  defp check_permissions(person, project_id) do
    query = from(p in Operately.Projects.Project, where: p.id == ^project_id)
    has_permissions = filter_by_full_access(query, person.id) |> Repo.exists?()

    if has_permissions do
      :ok
    else
      forbidden_or_not_found(query, person.id)
    end
  end
end
