defmodule OperatelyWeb.Api.Mutations.AddKeyResource do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :project_id, :string
    field :title, :string
    field :link, :string
    field :resource_type, :string
  end

  outputs do
    field :key_resource, :project_key_resource
  end

  def call(conn, inputs) do
    {:ok, project_id} = decode_id(inputs.project_id)

    case load_project(me(conn), project_id) do
      {:error, reason} ->
        {:error, reason}

      project ->
        {:ok, resource} = Operately.Projects.create_key_resource(%{inputs | project_id: project_id})
        resource = Map.put(resource, :project, project)

        {:ok, %{key_resource: OperatelyWeb.Api.Serializer.serialize(resource)}}
    end
  end

  defp load_project(person, project_id) do
    query = from(p in Operately.Projects.Project, where: p.id == ^project_id)

    filter_by_edit_access(query, person.id)
    |> Repo.one()
    |> case do
      nil -> forbidden_or_not_found(query, person.id)
      project -> project
    end
  end
end
