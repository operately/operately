defmodule Operately.Data.Change119BackfillDefaultResourceHubsTest do
  use Operately.DataCase
  alias Operately.Support.Factory
  alias Operately.Data.Change119BackfillDefaultResourceHubs, as: Change
  alias Operately.Groups.Group
  alias Operately.ResourceHubs.ResourceHub

  test "backfills oldest hub with stable ties and preserves existing defaults on reruns" do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_resource_hub(:other, :space, :creator)

    ids = [ctx.hub.id, ctx.other.id]
    Repo.update_all(from(h in ResourceHub, where: h.id in ^ids), set: [inserted_at: ~N[2020-01-01 00:00:00]])
    Repo.update_all(from(s in Group, where: s.id == ^ctx.space.id), set: [default_resource_hub_id: nil])
    Change.run()
    assert Repo.get!(Group, ctx.space.id).default_resource_hub_id == Enum.min(ids)

    chosen = Enum.max(ids)
    Repo.update_all(from(s in Group, where: s.id == ^ctx.space.id), set: [default_resource_hub_id: chosen])
    Change.run()
    assert Repo.get!(Group, ctx.space.id).default_resource_hub_id == chosen
  end

  test "handles disabled tools, single hubs, and spaces without hubs" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space)
    ctx.space |> Ecto.Changeset.change(default_resource_hub_id: nil) |> Ecto.Changeset.put_embed(:tools, %{ctx.space.tools | resource_hub_enabled: false}) |> Repo.update!()
    Change.run()
    assert Repo.get!(Group, ctx.space.id).default_resource_hub_id == ctx.hub.id
    Repo.delete!(ctx.hub)
    Change.run()
    assert is_nil(Repo.get!(Group, ctx.space.id).default_resource_hub_id)
  end
end
