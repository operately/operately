defmodule OperatelyEmail.Emails.GoalCheckInAcknowledgementEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Swoosh.TestAssertions

  alias OperatelyEmail.Emails.GoalCheckInAcknowledgementEmail
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_update(:check_in, :goal, :creator)
    |> then(&{:ok, &1})
  end

  test "renders a sentence-case check-in CTA and retains the destination", ctx do
    activity =
      activity_fixture(%{
        action: "goal_check_in_acknowledgement",
        author_id: ctx.creator.id,
        content: %{"goal_id" => ctx.goal.id, "update_id" => ctx.check_in.id}
      })

    GoalCheckInAcknowledgementEmail.send(ctx.creator, activity)
    url = Paths.goal_check_in_path(ctx.company, ctx.check_in) |> Paths.to_url()

    assert_email_sent(fn email ->
      assert email.subject =~ "acknowledged your check-in"
      assert email.html_body =~ ">View check-in</a>"
      assert email.html_body =~ url
      assert email.text_body =~ "Link: #{url}"
      true
    end)
  end
end
