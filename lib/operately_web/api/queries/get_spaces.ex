defmodule OperatelyWeb.Api.Queries.GetSpaces do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2, filter_by_view_access: 3]

  alias Operately.Groups.Group

  outputs do
    field :spaces, list_of(:space)
  end

  def call(conn, _inputs) do
    spaces = load(me(conn), company(conn))

    {:ok, %{spaces: Serializer.serialize(spaces, level: :full)}}
  end

  defp load(me, company) do
    spaces = load_spaces(me)
    company_space = load_company_space(me, company.company_space_id)

    spaces ++ company_space
    |> Enum.sort_by(&(&1.name))
  end

  defp load_spaces(me) do
    from(g in Group,
      where: g.company_id == ^me.company_id,
      preload: [:company]
    )
    |> filter_by_view_access(me.id)
    |> Operately.Repo.all()
  end

  defp load_company_space(me, id) do
    from(g in Group,
      join: c in assoc(g, :company), as: :company,
      where: g.id == ^id,
      preload: [company: c]
    )
    |> filter_by_view_access(me.id, named_binding: :company)
    |> Operately.Repo.all()
  end
end
