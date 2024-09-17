defmodule Operately.Operations.GoalCheckInTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Groups
  alias Operately.Support.RichText
  alias Operately.Access.Binding

  setup ctx do
    company = company_fixture()
    champion = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(champion)

    goal = goal_fixture(champion, %{
      space_id: space.id,
      reviewer_id: reviewer.id,
      champion_id: champion.id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.comment_access(),
    })

    Map.merge(ctx, %{company: company, space: space, champion: champion, reviewer: reviewer, goal: goal})
  end

  test "Creating goal update notifies everyone", ctx do
    members = create_space_members(ctx)

    {:ok, update} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalCheckIn.run(ctx.champion, ctx.goal,%{
        goal_id: ctx.goal.id,
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update,
      })
    end)

    action = "goal_check_in"
    activity = get_activity(update, action)

    assert 0 == notifications_count(action: action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: action)

    assert 4 == notifications_count(action: action) # 3 members + reviewer

    members
    |> Enum.filter(&(&1.id != ctx.champion.id))
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Creating goal update notifies selected people", ctx do
    create_space_members(ctx)

    {:ok, update} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalCheckIn.run(ctx.champion, ctx.goal,%{
        goal_id: ctx.goal.id,
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: false,
        subscriber_ids: [ctx.reviewer.id, ctx.champion.id],
        subscription_parent_type: :goal_update,
      })
    end)

    action = "goal_check_in"
    activity = get_activity(update, action)

    assert 0 == notifications_count(action: action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: action)

    assert 1 == notifications_count(action: action)
    assert hd(notifications).person_id == ctx.reviewer.id
  end

  test "Person without permissions is not notified", ctx do
    # Without permissions
    person = person_fixture_with_account(%{company_id: ctx.company.id})
    content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

    {:ok, update} = Operately.Operations.GoalCheckIn.run(ctx.champion, ctx.goal,%{
      goal_id: ctx.goal.id,
      target_values: [],
      content: content,
      send_to_everyone: true,
      subscriber_ids: [],
      subscription_parent_type: :goal_update,
    })

    action = "goal_check_in"
    activity = get_activity(update, action)

    assert notifications_count(action: action) == 0
    assert fetch_notifications(activity.id, action: action) == []

    # With permissions
    {:ok, _} = Groups.add_members(ctx.champion, ctx.space.id, [
      %{id: person.id, permissions: Binding.view_access()}
    ])

    {:ok, update} = Operately.Operations.GoalCheckIn.run(ctx.champion, ctx.goal,%{
      goal_id: ctx.goal.id,
      target_values: [],
      content: content,
      send_to_everyone: true,
      subscriber_ids: [],
      subscription_parent_type: :goal_update,
    })

    activity = get_activity(update, action)
    notifications = fetch_notifications(activity.id, action: action)

    assert notifications_count(action: action) == 1
    assert hd(notifications).person_id == person.id
  end

  #
  # Helpers
  #

  defp create_space_members(ctx) do
    people = Enum.map(1..3, fn _ -> person_fixture_with_account(%{company_id: ctx.company.id}) end)
    attrs = Enum.map(people ++ [ctx.reviewer], fn p -> %{id: p.id, permissions: Binding.edit_access()} end)
    {:ok, _} = Groups.add_members(ctx.champion, ctx.space.id, attrs)
    Groups.list_members(ctx.space)
  end

  defp get_activity(update, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["update_id"] == ^update.id
    )
    |> Repo.one()
  end
end
