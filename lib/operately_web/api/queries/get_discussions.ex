defmodule OperatelyWeb.Api.Queries.GetDiscussions do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group
  alias Operately.Updates.Update
  alias Operately.Access.Filters

  inputs do
    field :space_id, :string
  end

  outputs do
    field :discussions, list_of(:discussion)
  end

  def call(conn, inputs) do
    {:ok, space_id} = decode_id(inputs.space_id)
    updates = load(me(conn), space_id)

    {:ok, %{discussions: Serializer.serialize(updates, level: :essential)}}
  end

  defp load(person, space_id) do
    from(u in Update,
      join: s in Group, on: s.id == u.updatable_id, as: :space,
      where: u.updatable_id == ^space_id,
      where: u.updatable_type == :space,
      where: u.type == :project_discussion,
      preload: :author,
      order_by: [desc: u.inserted_at]
    )
    |> Filters.filter_by_view_access(person.id, named_binding: :space)
    |> Repo.all()
  end
end
