defmodule Operately.Data.Change119BackfillDefaultResourceHubs do
  import Ecto.Query
  alias Operately.Repo
  alias __MODULE__.{Space, Hub}

  def run do
    hubs =
      from(h in Hub,
        where: not is_nil(h.space_id),
        distinct: h.space_id,
        order_by: [asc: h.space_id, asc: h.inserted_at, asc: h.id],
        select: %{id: h.id, space_id: h.space_id}
      )

    from(s in Space, join: h in subquery(hubs), on: h.space_id == s.id, where: is_nil(s.default_resource_hub_id), update: [set: [default_resource_hub_id: h.id]])
    |> Repo.update_all([])
  end

  defmodule Space do
    use Operately.Schema

    schema "groups" do
      field :default_resource_hub_id, :binary_id
    end
  end

  defmodule Hub do
    use Operately.Schema

    schema "resource_hubs" do
      field :space_id, :binary_id
      field :inserted_at, :naive_datetime
    end
  end
end
