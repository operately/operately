defmodule Operately.Operations.ResourceHubLinkCreatingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Operations.ResourceHubLinkCreating

  @action "resource_hub_link_created"

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:mike, :space)
    |> Factory.add_space_member(:bob, :space)
    |> Factory.add_space_member(:jane, :space)
    |> Factory.add_resource_hub(:hub, :space, :creator, company_access_level: Binding.no_access())
  end

  test "Creating link sends notifications to everyone", ctx do
    {:ok, link} = Oban.Testing.with_testing_mode(:manual, fn ->
      create_link(ctx, true, [])
    end)

    activity = get_activity(link, @action)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: @action)

    assert 3 == notifications_count(action: @action)

    [ctx.mike, ctx.bob, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Creating link sends notifications to selected people", ctx do
    {:ok, link} = Oban.Testing.with_testing_mode(:manual, fn ->
      create_link(ctx, false, [ctx.mike.id, ctx.jane.id])
    end)

    activity = get_activity(link, @action)

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

    # Without permissions
    content = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()

    {:ok, link} = create_link(ctx, false, [], content)

    activity = get_activity(link, @action)

    assert notifications_count(action: @action) == 0
    assert fetch_notifications(activity.id, action: @action) == []

    # With permissions
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [
      %{id: ctx.person.id, access_level: Binding.view_access()}
    ])

    {:ok, link} = create_link(ctx, false, [], content)

    activity = get_activity(link, @action)
    notifications = fetch_notifications(activity.id, action: @action)

    assert notifications_count(action: @action) == 1
    assert hd(notifications).person_id == ctx.person.id
  end

  #
  # Helpers
  #

  defp create_link(ctx, send_to_everyone, people_list, content \\ nil) do
    ResourceHubLinkCreating.run(ctx.creator, ctx.hub, %{
      name: "My link",
      url: "http://localhost:4000",
      type: :other,
      content: content || RichText.rich_text("Content"),
      subscription_parent_type: :resource_hub_link,
      send_to_everyone: send_to_everyone,
      subscriber_ids: people_list,
    })
  end

  defp get_activity(link, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["link_id"] == ^link.id
    )
    |> Repo.one()
  end
end
