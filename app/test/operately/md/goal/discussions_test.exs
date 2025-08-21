defmodule Operately.MD.Goal.DiscussionsTest do
  use Operately.DataCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
  end

  test "it renders discussions without author role prefix", ctx do
    message = Operately.Support.RichText.rich_text("This is an important discussion about the goal.")
    ctx = Factory.add_goal_discussion(ctx, :discussion, :goal, title: "Important Discussion", message: message)

    discussions = Operately.Goals.Discussion.list(ctx.goal.id)
    rendered = Operately.MD.Goal.Discussions.render(discussions)

    assert rendered =~ "## Discussions"
    assert rendered =~ "Important Discussion"
    assert rendered =~ "This is an important discussion about the goal."
    # Should contain person name without "Author:" prefix
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ ctx.creator.title
    # Should NOT contain "Author:" prefix
    refute rendered =~ "Author: #{ctx.creator.full_name}"
  end

  test "it renders empty discussions", ctx do
    discussions = []
    rendered = Operately.MD.Goal.Discussions.render(discussions)

    assert rendered =~ "## Discussions"
    assert rendered =~ "_No discussions yet._"
  end

  test "it renders discussion comments correctly", ctx do
    message = Operately.Support.RichText.rich_text("This is a discussion.")
    ctx = Factory.add_goal_discussion(ctx, :discussion, :goal, title: "Test Discussion", message: message)
    ctx = Factory.add_comment(ctx, :comment, :discussion)

    discussions = Operately.Goals.Discussion.list(ctx.goal.id)
    rendered = Operately.MD.Goal.Discussions.render(discussions)

    assert rendered =~ "## Comments"
    assert rendered =~ "### Comment by #{ctx.creator.full_name} on"
  end

  test "it renders discussion reactions correctly", ctx do
    message = Operately.Support.RichText.rich_text("This is a discussion.")
    ctx = Factory.add_goal_discussion(ctx, :discussion, :goal, title: "Test Discussion", message: message)
    ctx = Factory.add_reactions(ctx, :reaction, :discussion, emoji: "👍")

    discussions = Operately.Goals.Discussion.list(ctx.goal.id)
    rendered = Operately.MD.Goal.Discussions.render(discussions)

    assert rendered =~ "Reactions: #{ctx.creator.full_name}: 👍"
  end
end