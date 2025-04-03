defmodule Operately.Data.Change045UpdateResourceHubActivitiesAccessContextTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.preload(:space, :access_context)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:folder, :hub)
    |> Factory.add_file(:my_file, :hub)
    |> Factory.add_document(:document, :hub)
    |> Factory.add_link(:link, :hub)
    |> create_activities()
  end

  test "updates access context of existing resource hub activities", ctx do
    context = fetch_resource_hub_context(ctx)

    Enum.each(ctx.activities, fn activity ->
      activity = Repo.preload(activity, :access_context)
      assert activity.access_context == context
    end)

    Operately.Data.Change045UpdateResourceHubActivitiesAccessContext.run()

    Enum.each(ctx.activities, fn activity ->
      activity = Repo.reload(activity) |> Repo.preload(:access_context)
      assert activity.access_context == ctx.space.access_context
    end)
  end

  #
  # Helpers
  #

  defp fetch_resource_hub_context(ctx) do
    Operately.Access.get_context(resource_hub_id: ctx.hub.id)
  end

  #
  # Setup helpers
  #

  defp create_activities(ctx) do
    functions = [&folder_activity/1, &file_activity/1, &link_activity/1, &document_activity/1]

    activities = Enum.reduce(functions, [], fn fun, acc ->
      acc ++ Enum.map(1..3, fn _ -> fun.(ctx) end)
    end)

    Map.put(ctx, :activities, activities)
  end

  defp folder_activity(ctx) do
    create_activity(ctx, node_id: ctx.folder.node_id, folder_id: ctx.folder.id)
  end

  defp file_activity(ctx) do
    create_activity(ctx, node_id: ctx.my_file.node_id, file_id: ctx.my_file.id)
  end

  defp link_activity(ctx) do
    create_activity(ctx, node_id: ctx.link.node_id, file_id: ctx.link.id)
  end

  defp document_activity(ctx) do
    create_activity(ctx, node_id: ctx.document.node_id, file_id: ctx.document.id)
  end

  defp create_activity(ctx, content) do
    content = Enum.into(content, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      resource_hub_id: ctx.hub.id,
    })

    activity = activity_fixture(author_id: ctx.creator.id, content: content)
    context = fetch_resource_hub_context(ctx)

    {:ok, activity} = Operately.Activities.Activity.changeset(activity, %{access_context_id: context.id})
    |> Repo.update

    activity
  end
end
