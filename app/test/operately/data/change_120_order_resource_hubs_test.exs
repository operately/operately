defmodule Operately.Data.Change120OrderResourceHubsTest do
  use Operately.DataCase
  import Ecto.Query
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Data.Change120OrderResourceHubs

  test "backfills stable positions in disabled spaces and preserves them on reruns" do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.set_space_tools(:space, resource_hub_enabled: false)
      |> Factory.fetch_default_resource_hub(:first, :space)
      |> Factory.add_resource_hub(:second, :space, :creator)

    Repo.query!("ALTER TABLE resource_hubs ALTER COLUMN position DROP NOT NULL")
    ids = [ctx.first.id, ctx.second.id]
    from(h in ResourceHub, where: h.id in ^ids) |> Repo.update_all(set: [position: nil, inserted_at: ~N[2020-01-01 00:00:00]])

    Change120OrderResourceHubs.run()

    ordered = Repo.all(from(h in ResourceHub, where: h.id in ^ids, order_by: h.position))
    assert Enum.map(ordered, & &1.id) == Enum.sort(ids)
    assert Enum.map(ordered, & &1.position) == [0, 1]

    Change120OrderResourceHubs.run()

    assert Enum.map(ordered, & &1.position) == Enum.map(ordered, &Repo.reload!(&1).position)
    assert Repo.reload!(ctx.space).default_resource_hub_id == ctx.first.id
  end
end
