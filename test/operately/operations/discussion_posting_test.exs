defmodule Operately.Operations.DiscussionPostingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.PeopleFixtures

  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:mike, :space)
    |> Factory.add_space_member(:bob, :space)
    |> Factory.add_space_member(:jane, :space)
  end

  test "Creating message sends notifications to everyone", ctx do
    {:ok, message} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.DiscussionPosting.run(ctx.creator, ctx.space, %{
        space_id: ctx.space.id,
        title: "Title",
        content: RichText.rich_text("Content"),
        send_to_everyone: true,
        subscription_parent_type: :message,
        subscriber_ids: [],
      })
    end)

    action = "discussion_posting"
    activity = get_activity(message, action)

    assert 0 == notifications_count(action: action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: action)

    assert 3 == notifications_count(action: action)

    [ctx.mike, ctx.bob, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Creating message sends notifications to selected people", ctx do
    {:ok, message} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.DiscussionPosting.run(ctx.creator, ctx.space, %{
        space_id: ctx.space.id,
        title: "Title",
        content: RichText.rich_text("Content"),
        send_to_everyone: false,
        subscription_parent_type: :message,
        subscriber_ids: [ctx.mike.id, ctx.jane.id],
      })
    end)

    action = "discussion_posting"
    activity = get_activity(message, action)

    assert 0 == notifications_count(action: action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: action)

    assert 2 == notifications_count(action: action)

    [ctx.mike, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Person without permissions is not notified", ctx do
    # Without permissions
    person = person_fixture_with_account(%{company_id: ctx.company.id})
    content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

    {:ok, message} = Operately.Operations.DiscussionPosting.run(ctx.creator, ctx.space, %{
      space_id: ctx.space.id,
      title: "Title",
      content: content,
      send_to_everyone: false,
      subscription_parent_type: :message,
      subscriber_ids: [],
    })

    action = "discussion_posting"
    activity = get_activity(message, action)

    assert notifications_count(action: action) == 0
    assert fetch_notifications(activity.id, action: action) == []

    # With permissions
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [
      %{id: person.id, permissions: Operately.Access.Binding.view_access()}
    ])

    {:ok, message} = Operately.Operations.DiscussionPosting.run(ctx.creator, ctx.space, %{
      space_id: ctx.space.id,
      title: "Title",
      content: content,
      send_to_everyone: false,
      subscription_parent_type: :message,
      subscriber_ids: [],
    })

    activity = get_activity(message, action)
    notifications = fetch_notifications(activity.id, action: action)

    assert notifications_count(action: action) == 1
    assert hd(notifications).person_id == person.id
  end

  #
  # Helpers
  #

  defp get_activity(message, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["discussion_id"] == ^message.id
    )
    |> Repo.one()
  end
end
