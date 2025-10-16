defmodule Operately.Data.Change054CreateSubscriptionsForExistingGoalDiscussionsTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.Notifications.SubscriptionList

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_space_member(:member1, :space)
    |> Factory.add_space_member(:member2, :space)
    |> Factory.add_space_member(:member3, :space)
    |> Factory.add_goal(:public_goal, :space, champion: :champion, reviewer: :reviewer)
    |> Factory.add_goal(:secret_goal, :space,
      champion: :champion,
      reviewer: :reviewer,
      space_access: Binding.no_access(),
      company_access: Binding.no_access()
    )
  end

  test "creates subscriptions list for existing goal discussions", ctx do
    members_with_access = [ctx.creator.id, ctx.champion.id, ctx.reviewer.id]
    all_members = [ctx.member1.id, ctx.member2.id, ctx.member3.id | members_with_access]

    public = create_threads(ctx, ctx.public_goal)
    secret = create_threads(ctx, ctx.secret_goal)

    Enum.each(public ++ secret, fn thread ->
      assert thread.subscription_list_id == nil
    end)

    Operately.Data.Change054CreateSubscriptionsForExistingGoalDiscussions.run()

    assert_subscriptions_created(public, all_members)
    assert_subscriptions_created(secret, members_with_access)
  end

  #
  # Steps
  #

  defp create_threads(ctx, goal) do
    discussions = Enum.map(1..3, fn _ -> create_goal_discussion(ctx, goal) end)
    closed_thread = close_goal(ctx, goal)
    reopened_thread = reopen_goal(ctx, goal)

    [closed_thread, reopened_thread | discussions]
  end

  defp assert_subscriptions_created(threads, person_ids) do
    Enum.each(threads, fn thread ->
      thread = Repo.reload(thread)
      assert thread.subscription_list_id != nil

      {:ok, list} = SubscriptionList.get(:system, id: thread.subscription_list_id, opts: [preload: :subscriptions])

      assert list.parent_id == thread.id
      assert list.parent_type == :comment_thread

      assert length(list.subscriptions) == length(person_ids)

      Enum.each(list.subscriptions, fn subscription ->
        assert subscription.person_id in person_ids
      end)
    end)
  end

  #
  # Setup
  #

  defp create_goal_discussion(ctx, goal) do
    {:ok, activity} =
      Operately.Operations.GoalDiscussionCreation.run(ctx.creator, goal, %{
        title: "some title",
        content: Operately.Support.RichText.rich_text("content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    set_subscription_list_id_to_nil(activity.comment_thread)
  end

  defp close_goal(ctx, goal) do
    {:ok, goal} =
      Operately.Operations.GoalClosing.run(ctx.creator, goal, %{
        success: "yes",
        success_status: "achieved",
        content: Operately.Support.RichText.rich_text("content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    get_comment_thread(goal.id, "goal_closing")
    |> set_subscription_list_id_to_nil()
  end

  defp reopen_goal(ctx, goal) do
    {:ok, goal} =
      Operately.Operations.GoalReopening.run(ctx.creator, goal, %{
        content: Operately.Support.RichText.rich_text("content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    get_comment_thread(goal.id, "goal_reopening")
    |> set_subscription_list_id_to_nil()
  end

  defp set_subscription_list_id_to_nil(comment_thread) do
    id = Ecto.UUID.dump!(comment_thread.id)

    from(ct in "comment_threads", where: ct.id == ^id)
    |> Operately.Repo.update_all(set: [subscription_list_id: nil])

    Repo.reload(comment_thread)
  end

  defp get_comment_thread(goal_id, action) do
    activity =
      from(a in Operately.Activities.Activity,
        where: a.content["goal_id"] == ^goal_id and a.action == ^action,
        preload: [:comment_thread]
      )
      |> Operately.Repo.one()

    activity.comment_thread
  end
end
