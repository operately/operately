defmodule Operately.Operations.ResourceHubRenamingTest do
  use Operately.DataCase
  import Ecto.Query

  alias Operately.Activities.Activity
  alias Operately.Operations.ResourceHubRenaming

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  test "successive renames from the same snapshot record the current previous name", ctx do
    assert {:ok, _} = ResourceHubRenaming.run(ctx.creator, ctx.hub, "First name")
    assert {:ok, %{hub: renamed}} = ResourceHubRenaming.run(ctx.creator, ctx.hub, "Second name")
    assert renamed.name == "Second name"
    assert Repo.reload!(ctx.hub).name == "Second name"
    assert length(activities(ctx.hub)) == 2
    activity = Enum.find(activities(ctx.hub), &(&1.content["new_name"] == "Second name"))
    assert activity.content["old_name"] == "First name"
  end

  test "a stale snapshot cannot skip a rename back to the original name", ctx do
    assert {:ok, _} = ResourceHubRenaming.run(ctx.creator, ctx.hub, "First name")
    assert {:ok, %{hub: renamed}} = ResourceHubRenaming.run(ctx.creator, ctx.hub, ctx.hub.name)
    assert renamed.name == ctx.hub.name
    assert Repo.reload!(ctx.hub).name == ctx.hub.name
    assert length(activities(ctx.hub)) == 2
  end

  test "repeating the saved name with a stale snapshot creates no extra activity", ctx do
    assert {:ok, _} = ResourceHubRenaming.run(ctx.creator, ctx.hub, "First name")
    assert {:ok, %{hub: renamed}} = ResourceHubRenaming.run(ctx.creator, ctx.hub, "  First name  ")
    assert renamed.name == "First name"
    assert [_activity] = activities(ctx.hub)
  end

  defp activities(hub) do
    Repo.all(from a in Activity, where: a.action == "resource_hub_renamed" and a.content["resource_hub_id"] == ^hub.id)
  end
end
