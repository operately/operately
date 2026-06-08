defmodule Operately.Data.Change103SyncResourceHubActivityAccessContextsTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures

  alias Operately.Access
  alias Operately.Data.Change103SyncResourceHubActivityAccessContexts
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.preload(:space, :access_context)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  test "moves resource hub activities from stale contexts to resource hub contexts", ctx do
    hub_context = Access.get_context!(resource_hub_id: ctx.hub.id)
    activity = create_activity(ctx, ctx.space.access_context.id)

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

  defp create_activity(ctx, access_context_id) do
    activity_fixture(
      action: "resource_hub_document_created",
      author_id: ctx.creator.id,
      access_context_id: access_context_id,
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "resource_hub_id" => ctx.hub.id,
        "document_id" => Ecto.UUID.generate(),
        "node_id" => Ecto.UUID.generate(),
        "name" => "Launch plan"
      }
    )
  end
end
