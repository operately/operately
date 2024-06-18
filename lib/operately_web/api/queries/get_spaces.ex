defmodule OperatelyWeb.Api.Queries.GetSpaces do
  use TurboConnect.Query

  import Ecto.Query
  alias Operately.Groups.Group

  outputs do
    field :spaces, list_of(:space)
  end

  def call(conn, _inputs) do
    me = conn.assigns.current_account.person
    spaces = load(me)

    {:ok, serialize(spaces)}
  end

  defp load(me) do
    query = from g in Group, where: g.company_id == ^me.company_id, preload: [:company], order_by: [asc: g.name]
    Operately.Repo.all(query)
  end

  defp serialize(spaces) do
    %{spaces: Enum.map(spaces, fn space -> serialize_space(space) end)}
  end

  defp serialize_space(space) do
    %{
      id: space.id,
      name: space.name,
      mission: space.mission,
      icon: space.icon,
      color: space.color,
      is_company_space: space.company.company_space_id == space.id
    }
  end
end
