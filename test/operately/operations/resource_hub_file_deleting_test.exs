defmodule Operately.Operations.ResourceHubFileDeletingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Operations.ResourceHubFileDeleting

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:mike, :space)
    |> Factory.add_space_member(:bob, :space)
    |> Factory.add_space_member(:jane, :space)
    |> Factory.add_resource_hub(:hub, :space, :creator, company_access_level: Binding.no_access())
  end

  @action "resource_hub_file_deleted"

  test "Deleting file sends notifications to everyone", ctx do
    file = create_file(ctx, true, [])

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      ResourceHubFileDeleting.run(ctx.creator, file)
    end)

    activity = get_activity(file, @action)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: @action)

    assert 3 == notifications_count(action: @action)

    [ctx.mike, ctx.bob, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Deleting file sends notifications to selected people", ctx do
    file = create_file(ctx, false, [ctx.mike.id, ctx.jane.id])

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      ResourceHubFileDeleting.run(ctx.creator, file)
    end)

    activity = get_activity(file, @action)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: @action)

    assert 2 == notifications_count(action: @action)

    [ctx.mike, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Person without permissions is not notified", ctx do
    ctx = Factory.add_company_member(ctx, :person)

    content = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()
    file = create_file(ctx, false, [ctx.person.id], content)

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      ResourceHubFileDeleting.run(ctx.creator, file)
    end)

    activity = get_activity(file, @action)
    perform_job(activity.id)

    assert notifications_count(action: @action) == 0
    assert fetch_notifications(activity.id, action: @action) == []
  end

  #
  # Helpers
  #

  defp create_file(ctx, send_to_everyone, people_list, content \\ nil) do
    blob = Operately.BlobsFixtures.blob_fixture(%{author_id: ctx.creator.id, company_id: ctx.company.id})

    {:ok, file} = Operately.Operations.ResourceHubFileCreating.run(ctx.creator, ctx.hub, %{
      name: "Some name",
      content: content || RichText.rich_text("Content"),
      send_to_everyone: send_to_everyone,
      subscription_parent_type: :resource_hub_file,
      subscriber_ids: people_list,
      blob_id: blob.id,
    })
    Repo.preload(file, :resource_hub)
  end

  defp get_activity(file, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["file_id"] == ^file.id
    )
    |> Repo.one()
  end
end
