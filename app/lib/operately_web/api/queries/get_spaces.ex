defmodule OperatelyWeb.Api.Queries.GetSpaces do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  outputs do
    field :spaces, list_of(:space)
  end

  inputs do
    field :include_access_levels, :boolean
    field :include_members, :boolean
  end

  def call(conn, inputs) do
    spaces = load_spaces(me(conn), inputs)

    {:ok, %{spaces: Serializer.serialize(spaces, level: :full)}}
  end

  defp load_spaces(me, inputs) do
    from(g in Operately.Groups.Group,
      where: g.company_id == ^me.company_id,
      order_by: g.name,
      preload: [:company, :members]
    )
    |> filter_by_view_access(me.id)
    |> Repo.all()
    |> load_access_levels(inputs[:include_access_levels])
  end

  defp load_access_levels(spaces, true) do
    Enum.map(spaces, &Operately.Groups.Group.preload_access_levels/1)
  end

  defp load_access_levels(spaces, _), do: spaces
end
