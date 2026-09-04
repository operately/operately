defmodule OperatelyEmail.Emails.GoalClosingEmailTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Swoosh.TestAssertions

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias OperatelyEmail.Emails.GoalClosingEmail
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_company_owner(:owner)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:champion, :space)
      |> Factory.add_space_member(:reviewer, :space)
      |> Factory.add_space_member(:editor, :space)
      |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer, space_access: Binding.edit_access())
      |> Factory.close_goal(:goal, author: :champion)

    {:ok, ctx}
  end

  test "reviewer gets an Acknowledge CTA with the auto-ack URL", ctx do
    send_closing_email(ctx, ctx.reviewer)
    assert_acknowledge_email()
  end

  test "champion gets a View Retrospective CTA when they closed the goal", ctx do
    send_closing_email(ctx, ctx.champion)
    assert_view_retrospective_email()
  end

  test "champion gets an Acknowledge CTA when the reviewer closed the goal", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:reviewer_closed_goal, :space, champion: :champion, reviewer: :reviewer, space_access: Binding.edit_access())
      |> Factory.close_goal(:reviewer_closed_goal, author: :reviewer)

    send_closing_email(ctx, ctx.champion, ctx.reviewer_closed_goal)
    assert_acknowledge_email()
  end

  test "reviewer and champion get an Acknowledge CTA when a third person closed the goal", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:editor_closed_goal, :space, champion: :champion, reviewer: :reviewer, space_access: Binding.edit_access())
      |> Factory.close_goal(:editor_closed_goal, author: :editor)

    send_closing_email(ctx, ctx.reviewer, ctx.editor_closed_goal)
    assert_acknowledge_email()

    send_closing_email(ctx, ctx.champion, ctx.editor_closed_goal)
    assert_acknowledge_email()
  end

  test "company owner gets a View Retrospective CTA", ctx do
    send_closing_email(ctx, ctx.owner)
    assert_view_retrospective_email()
  end

  test "space member with edit access gets a View Retrospective CTA", ctx do
    send_closing_email(ctx, ctx.editor)
    assert_view_retrospective_email()
  end

  defp send_closing_email(ctx, person), do: send_closing_email(ctx, person, ctx.goal)

  defp send_closing_email(_ctx, person, goal) do
    flush_emails()
    GoalClosingEmail.send(person, latest_goal_closing(goal))
  end

  defp assert_acknowledge_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">Acknowledge</a>"
      assert email.html_body =~ "acknowledge=true"
      refute email.html_body =~ ">View Retrospective</a>"
      true
    end)
  end

  defp assert_view_retrospective_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">View Retrospective</a>"
      refute email.html_body =~ ">Acknowledge</a>"
      refute email.html_body =~ "acknowledge=true"
      true
    end)
  end

  defp latest_goal_closing(goal) do
    from(a in Activity,
      where: a.action == "goal_closing",
      where: a.content["goal_id"] == ^goal.id,
      order_by: [desc: a.inserted_at],
      limit: 1
    )
    |> Operately.Repo.one!()
  end

  defp flush_emails do
    receive do
      {:email, _email} -> flush_emails()
      {:emails, _emails} -> flush_emails()
    after
      0 -> :ok
    end
  end
end
