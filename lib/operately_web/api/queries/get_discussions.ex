defmodule OperatelyWeb.Api.Queries.GetDiscussions do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters

  alias Operately.Repo
  alias Operately.Groups.Group
  alias Operately.Updates.Update

  inputs do
    field :space_id, :string
  end

  outputs do
    field :discussions, list_of(:discussion)
  end

  def call(conn, inputs) do
    {:ok, space_id} = decode_id(inputs.space_id)

    updates = load(me(conn), company(conn), space_id)

    {:ok, %{discussions: Serializer.serialize(updates, level: :essential)}}
  end

  defp load(person, company, space_id) do
    from(u in Update,
      join: s in Group, on: s.id == u.updatable_id, as: :space,
      where: u.updatable_id == ^space_id,
      where: u.updatable_type == :space,
      where: u.type == :project_discussion,
      preload: :author,
      order_by: [desc: u.inserted_at]
    )
    |> view_access_filter(person, space_id, company.company_space_id)
    |> Repo.all()
  end

  defp view_access_filter(q, person, space_id, c_space_id) when space_id == c_space_id do
    filter_by_view_access(q, person.id, [
      join_parent: :company,
      named_binding: :space,
    ])
  end
  defp view_access_filter(q, person, _, _) do
    filter_by_view_access(q, person.id, named_binding: :space)
  end
end
