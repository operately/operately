defmodule OperatelyWeb.Api.Queries.GetKeyResource do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]
  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Repo

  inputs do
    field :id, :string
  end

  outputs do
    field :key_resource, :project_key_resource
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs[:id])

    case load(id, me(conn)) do
      nil ->
        {:error, :not_found}
      resource ->
        {:ok, %{key_resource: Serializer.serialize(resource, level: :full)}}
    end
  end

  defp load(id, person) do
    from(k in Operately.Projects.KeyResource,
      join: p in assoc(k, :project), as: :project,
      preload: [project: p],
      where: k.id == ^id
    )
    |> filter_by_view_access(person.id, named_binding: :project)
    |> Repo.one()
  end
end
