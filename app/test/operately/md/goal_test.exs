defmodule Operately.MD.GoalTest do
  use Operately.DataCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_goal(:goal, :marketing)
  end

  test "it renders the goal as a markdown", ctx do
    goal =
      Operately.Repo.preload(ctx.goal,
        updates: [:author],
        targets: [],
        group: [],
        parent_goal: [],
        projects: [],
        champion: [],
        reviewer: [],
        discussions: [:author]
      )

    rendered = Operately.MD.Goal.render(goal)

    assert rendered =~ "# #{goal.name}"
    assert rendered =~ "Status: #{Operately.Goals.Goal.status(goal)}"
    assert rendered =~ "Progress:"
    assert rendered =~ "Space: #{goal.group.name}"
    assert rendered =~ "Created:"
    assert rendered =~ "Last Updated:"
    assert rendered =~ "Parent Goal: None (Top Level Goal)"
  end

  test "it renders discussions in the markdown", ctx do
    ctx = Factory.add_goal_discussion(ctx, :discussion, :goal, title: "Discussion Title", message: Operately.Support.RichText.rich_text("This is a discussion about the goal."))

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Discussions"
    assert rendered =~ "Discussion Title"
    assert rendered =~ "This is a discussion about the goal."
    assert rendered =~ ctx.creator.full_name
  end
end
