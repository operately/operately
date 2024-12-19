defmodule Operately.Data.Change044RenameResourceHubsTest do
  use Operately.DataCase

  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space1)
    |> Factory.add_space(:space2)
  end

  test "renames existing resource hubs to Documents & Files", ctx do
    hubs1 = Enum.map(1..3, fn _ ->
      resource_hub_fixture(ctx.creator, ctx.space1, name: "Some name")
    end)
    hubs2 = Enum.map(1..3, fn _ ->
      resource_hub_fixture(ctx.creator, ctx.space2, name: "Some name")
    end)
    hubs = hubs1 ++ hubs2

    Enum.each(hubs, fn hub ->
      refute hub.name == "Documents & Files"
    end)

    Operately.Data.Change044RenameResourceHubs.run()

    Enum.each(hubs, fn hub ->
      hub = Repo.reload(hub)
      assert hub.name == "Documents & Files"
    end)
  end
end
