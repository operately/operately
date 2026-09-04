defmodule OperatelyEmail.GoalCheckInEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias Operately.Access.Binding
  alias OperatelyEmail.Emails.GoalCheckInEmail
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
      |> Factory.add_goal_update(:check_in, :goal, :champion)

    {:ok, ctx}
  end

  test "reviewer gets an Acknowledge CTA with the auto-ack URL", ctx do
    send_check_in_email(ctx, ctx.reviewer)
    assert_acknowledge_email()
  end

  test "champion gets a View Check-In CTA when they authored the check-in", ctx do
    send_check_in_email(ctx, ctx.champion)
    assert_view_check_in_email()
  end

  test "reviewer gets a View Check-In CTA when they authored the check-in", ctx do
    ctx = Factory.add_goal_update(ctx, :reviewer_check_in, :goal, :reviewer)

    send_check_in_email(ctx, ctx.reviewer, ctx.reviewer_check_in)
    assert_view_check_in_email()
  end

  test "champion gets an Acknowledge CTA when they did not author the check-in", ctx do
    ctx = Factory.add_goal_update(ctx, :editor_check_in, :goal, :editor)

    send_check_in_email(ctx, ctx.champion, ctx.editor_check_in)
    assert_acknowledge_email()
  end

  test "champion gets an Acknowledge CTA when the reviewer authored the check-in", ctx do
    ctx = Factory.add_goal_update(ctx, :reviewer_check_in, :goal, :reviewer)

    send_check_in_email(ctx, ctx.champion, ctx.reviewer_check_in)
    assert_acknowledge_email()
  end

  test "company owner still gets a View Check-In CTA when the reviewer authored the check-in", ctx do
    ctx = Factory.add_goal_update(ctx, :reviewer_check_in, :goal, :reviewer)

    send_check_in_email(ctx, ctx.owner, ctx.reviewer_check_in)
    assert_view_check_in_email()
  end

  test "company owner gets a View Check-In CTA", ctx do
    send_check_in_email(ctx, ctx.owner)
    assert_view_check_in_email()
  end

  test "space member with edit access gets a View Check-In CTA", ctx do
    send_check_in_email(ctx, ctx.editor)
    assert_view_check_in_email()
  end

  test "non-reviewer and non-champion recipients get a View Check-In CTA when the goal has no reviewer", ctx do
    {:ok, _} = Operately.Goals.update_goal(ctx.goal, %{reviewer_id: nil})

    send_check_in_email(ctx, ctx.champion)
    assert_view_check_in_email()

    send_check_in_email(ctx, ctx.owner)
    assert_view_check_in_email()

    send_check_in_email(ctx, ctx.editor)
    assert_view_check_in_email()
  end

  test "champion gets an Acknowledge CTA when there is no reviewer and they did not author the check-in", ctx do
    {:ok, _} = Operately.Goals.update_goal(ctx.goal, %{reviewer_id: nil})
    ctx = Factory.add_goal_update(ctx, :editor_check_in, :goal, :editor)

    send_check_in_email(ctx, ctx.champion, ctx.editor_check_in)
    assert_acknowledge_email()
  end

  defp send_check_in_email(ctx, person), do: send_check_in_email(ctx, person, ctx.check_in)

  defp send_check_in_email(ctx, person, update) do
    activity =
      activity_fixture(%{
        author_id: update.author_id,
        action: "goal_check_in",
        content: %{
          "update_id" => update.id,
          "goal_id" => ctx.goal.id
        }
      })

    flush_emails()
    GoalCheckInEmail.send(person, activity)
  end

  defp assert_acknowledge_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">Acknowledge</a>"
      assert email.html_body =~ "acknowledge=true"
      assert email.text_body =~ "Acknowledge:"
      refute email.html_body =~ ">View Check-In</a>"
      true
    end)
  end

  defp assert_view_check_in_email do
    assert_email_sent(fn email ->
      assert email.html_body =~ ">View Check-In</a>"
      assert email.text_body =~ "View Check-In:"
      refute email.html_body =~ ">Acknowledge</a>"
      refute email.html_body =~ "acknowledge=true"
      refute email.text_body =~ "Acknowledge:"
      true
    end)
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
