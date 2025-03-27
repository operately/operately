defmodule OperatelyEmail.Emails.GoalCheckInEmailTest do
  use Operately.DataCase

  alias OperatelyEmail.Emails.GoalCheckInEmail

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
    |> Factory.add_goal_update(:check_in, :goal, :champion)
  end

  test "constructs the email with the correct content", ctx do
    content = GoalCheckInEmail.construct(ctx.check_in, ctx.goal, ctx.reviewer, ctx.champion, ctx.company)
    {:safe, html} = OperatelyEmail.Templates.rich_text(content)

    IO.inspect(html)
  end
end
