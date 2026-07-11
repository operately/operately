defmodule Operately.Data.Change104AcknowledgeExistingRetrospectivesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.Factory
  alias Operately.Data.Change104AcknowledgeExistingRetrospectives, as: Change
  alias Operately.Data.Change104AcknowledgeExistingRetrospectives.{Activity, CommentThread, Retrospective}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
  end

  test "acknowledges existing project retrospectives as their author at creation time", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_project_retrospective(:retrospective, :project, :champion)
      |> Factory.add_project(:other_project, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_project_retrospective(:already_acked, :other_project, :champion)

    already_acked_at = ~U[2024-01-15 12:00:00Z]

    from(r in Retrospective, where: r.id == ^ctx.already_acked.id)
    |> Repo.update_all(set: [acknowledged_by_id: ctx.reviewer.id, acknowledged_at: already_acked_at])

    Change.run()

    retrospective = reload_retrospective(ctx.retrospective.id)
    assert retrospective.acknowledged_by_id == ctx.champion.id
    assert_same_second(retrospective.acknowledged_at, retrospective.inserted_at)

    already_acked = reload_retrospective(ctx.already_acked.id)
    assert already_acked.acknowledged_by_id == ctx.reviewer.id
    assert DateTime.compare(already_acked.acknowledged_at, already_acked_at) == :eq
  end

  test "acknowledges existing goal closing retrospectives as their closer at creation time", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.close_goal(:goal, author: :champion)
      |> Factory.add_goal(:other_goal, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.close_goal(:other_goal, author: :champion)
      |> Factory.add_goal(:open_goal, :space, champion: :champion, reviewer: :reviewer)
      |> Factory.add_goal_discussion(:discussion, :open_goal)

    already_acked_at = ~U[2024-02-20 09:30:00Z]
    already_acked_thread = goal_closing_thread(ctx.other_goal.id)

    from(t in CommentThread, where: t.id == ^already_acked_thread.id)
    |> Repo.update_all(set: [acknowledged_by_id: ctx.reviewer.id, acknowledged_at: already_acked_at])

    Change.run()
    Change.run()

    thread = goal_closing_thread(ctx.goal.id)
    activity = goal_closing_activity(ctx.goal.id)
    assert thread.acknowledged_by_id == activity.author_id
    assert_same_second(thread.acknowledged_at, thread.inserted_at)

    already_acked = reload_comment_thread(already_acked_thread.id)
    assert already_acked.acknowledged_by_id == ctx.reviewer.id
    assert DateTime.compare(already_acked.acknowledged_at, already_acked_at) == :eq

    discussion_thread = reload_comment_thread(ctx.discussion.id)
    refute discussion_thread.acknowledged_by_id
    refute discussion_thread.acknowledged_at
  end

  defp reload_retrospective(id) do
    Repo.one!(from(r in Retrospective, where: r.id == ^id))
  end

  defp reload_comment_thread(id) do
    Repo.one!(from(t in CommentThread, where: t.id == ^id))
  end

  defp goal_closing_thread(goal_id) do
    activity = goal_closing_activity(goal_id)
    reload_comment_thread(activity.comment_thread_id)
  end

  defp goal_closing_activity(goal_id) do
    Repo.one!(
      from(a in Activity,
        where: a.action == "goal_closing",
        where: fragment("(?->>'goal_id')::uuid = ?", a.content, type(^goal_id, :binary_id)),
        order_by: [desc: a.inserted_at],
        limit: 1
      )
    )
  end

  defp assert_same_second(%DateTime{} = left, %NaiveDateTime{} = right) do
    right = DateTime.from_naive!(right, "Etc/UTC") |> DateTime.truncate(:second)
    assert DateTime.compare(DateTime.truncate(left, :second), right) == :eq
  end

  defp assert_same_second(%DateTime{} = left, %DateTime{} = right) do
    assert DateTime.compare(DateTime.truncate(left, :second), DateTime.truncate(right, :second)) == :eq
  end
end
