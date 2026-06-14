defmodule Operately.Data.Change101BackfillProjectResourceHubsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Data.Change101BackfillProjectResourceHubs, as: Change
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project_without_hub, :space)
      |> Factory.add_project(:soft_deleted_project_without_hub, :space)
      |> Factory.add_project(:project_with_hub, :space)

    remove_project_resource_hub(ctx.project_without_hub)
    remove_project_resource_hub(ctx.soft_deleted_project_without_hub)
    {:ok, _} = Repo.soft_delete(ctx.soft_deleted_project_without_hub)

    {:ok, ctx}
  end

  test "creates resource hubs for active and soft-deleted projects that are missing them", ctx do
    contexts_before = length(Access.list_contexts())

    refute resource_hub_for(ctx.project_without_hub.id)
    refute resource_hub_for(ctx.soft_deleted_project_without_hub.id)
    assert resource_hub_for(ctx.project_with_hub.id)

    Change.run()

    assert_resource_hub(ctx.project_without_hub.id)
    assert_resource_hub(ctx.soft_deleted_project_without_hub.id)
    assert length(Access.list_contexts()) == contexts_before
  end

  test "is idempotent and does not replace existing project resource hubs", ctx do
    existing_hub = resource_hub_for(ctx.project_with_hub.id)

    Change.run()
    Change.run()

    assert count_resource_hubs(ctx.project_without_hub.id) == 1
    assert count_resource_hubs(ctx.soft_deleted_project_without_hub.id) == 1
    assert count_resource_hubs(ctx.project_with_hub.id) == 1
    assert resource_hub_for(ctx.project_with_hub.id).id == existing_hub.id
  end

  defp assert_resource_hub(project_id) do
    assert %ResourceHub{} = hub = resource_hub_for(project_id)
    assert hub.project_id == project_id
    assert hub.space_id == nil
    assert hub.name == "Documents & Files"
    assert hub.description == nil
  end

  defp remove_project_resource_hub(project) do
    project
    |> Repo.preload(:resource_hub)
    |> Map.fetch!(:resource_hub)
    |> Repo.delete!()
  end

  defp resource_hub_for(project_id) do
    Repo.one(from(h in ResourceHub, where: h.project_id == ^project_id))
  end

  defp count_resource_hubs(project_id) do
    Repo.one(from(h in ResourceHub, where: h.project_id == ^project_id, select: count(h.id)))
  end
end
