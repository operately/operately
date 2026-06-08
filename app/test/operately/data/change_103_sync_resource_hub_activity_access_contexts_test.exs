defmodule Operately.Data.Change103SyncResourceHubActivityAccessContextsTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures

  alias Operately.Access
  alias Operately.Data.Change103SyncResourceHubActivityAccessContexts
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.preload(:space, :access_context)
    |> Factory.add_project(:project, :space)
    |> Factory.add_resource_hub(:custom_hub, :space, :creator)
  end

  test "moves default space hub activities to the space context", ctx do
    hub = Repo.get_by!(ResourceHub, space_id: ctx.space.id, name: "Documents & Files")
    custom_hub_context = Access.get_context!(resource_hub_id: ctx.custom_hub.id)
    activity = create_activity(ctx, hub, custom_hub_context.id)

    assert activity.access_context_id == custom_hub_context.id

    Change103SyncResourceHubActivityAccessContexts.run()

    activity = Repo.reload(activity)

    assert activity.access_context_id == ctx.space.access_context.id
  end

  test "moves project hub activities to the project context", ctx do
    project_context = Access.get_context!(project_id: ctx.project.id)
    stale_context = ctx.space.access_context
    hub = Operately.ResourceHubs.ProjectHub.get_project_hub(ctx.project.id)
    activity = create_activity(ctx, hub, stale_context.id)

    assert activity.access_context_id == stale_context.id

    Change103SyncResourceHubActivityAccessContexts.run()

    activity = Repo.reload(activity)

    assert activity.access_context_id == project_context.id
  end

  test "moves custom space hub activities to the resource hub context", ctx do
    hub_context = Access.get_context!(resource_hub_id: ctx.custom_hub.id)
    activity = create_activity(ctx, ctx.custom_hub, ctx.space.access_context.id)

    assert activity.access_context_id == ctx.space.access_context.id

    Change103SyncResourceHubActivityAccessContexts.run()

    activity = Repo.reload(activity)

    assert activity.access_context_id == hub_context.id
  end

  test "leaves non-resource hub activities unchanged", ctx do
    activity = activity_fixture(author_id: ctx.creator.id, access_context_id: ctx.space.access_context.id)

    Change103SyncResourceHubActivityAccessContexts.run()

    activity = Repo.reload(activity)

    assert activity.access_context_id == ctx.space.access_context.id
  end

  defp create_activity(ctx, hub, access_context_id) do
    activity_fixture(
      action: "resource_hub_document_created",
      author_id: ctx.creator.id,
      access_context_id: access_context_id,
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "resource_hub_id" => hub.id,
        "document_id" => Ecto.UUID.generate(),
        "node_id" => Ecto.UUID.generate(),
        "name" => "Launch plan"
      }
    )
  end
end
