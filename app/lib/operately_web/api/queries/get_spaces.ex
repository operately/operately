defmodule OperatelyWeb.Api.Queries.GetSpaces do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group

  inputs do
    field? :access_level, :access_options, null: false

    field? :include_access_levels, :boolean, null: false
    field? :include_members, :boolean, null: false
  end

  outputs do
    field? :spaces, list_of(:space), null: true
  end

  def call(conn, inputs) do
    spaces = load_spaces(me(conn), inputs)

    {:ok, %{spaces: Serializer.serialize(spaces, level: :full)}}
  end

  defp load_spaces(me, inputs) do
    Group.search(me, "", inputs[:access_level])
    |> Repo.preload([:company, members: from(m in Operately.People.Person, where: m.type != :ai)])
    |> load_access_levels(inputs[:include_access_levels])
  end

  defp load_access_levels(spaces, true) do
    Enum.map(spaces, &Operately.Groups.Group.preload_access_levels/1)
  end

  defp load_access_levels(spaces, _), do: spaces
end
