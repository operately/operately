defmodule OperatelyWeb.Api.Queries.GetSpaces do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  outputs do
    field :spaces, list_of(:space)
  end

  def call(conn, _inputs) do
    spaces = load_spaces(me(conn))

    {:ok, %{spaces: Serializer.serialize(spaces, level: :full)}}
  end

  defp load_spaces(me) do
    from(g in Operately.Groups.Group,
      where: g.company_id == ^me.company_id,
      order_by: g.name,
      preload: [:company]
    )
    |> filter_by_view_access(me.id)
    |> Repo.all()
  end
end
