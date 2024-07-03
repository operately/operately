defmodule OperatelyWeb.Api.Queries.GetSpaces do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group

  outputs do
    field :spaces, list_of(:space)
  end

  def call(conn, _inputs) do
    me = conn.assigns.current_account.person
    spaces = load(me)

    {:ok, %{spaces: Serializer.serialize(spaces, level: :full)}}
  end

  defp load(me) do
    query = from g in Group, where: g.company_id == ^me.company_id, preload: [:company], order_by: [asc: g.name]
    Operately.Repo.all(query)
  end
end
