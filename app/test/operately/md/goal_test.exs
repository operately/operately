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
        checks: [],
        group: [],
        parent_goal: [],
        projects: [],
        champion: [],
        reviewer: []
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

  test "it renders the checklist in the markdown", ctx do
    ctx = Factory.add_goal_check(ctx, :check1, :goal, name: "Checklist Item 1", completed: false)
    ctx = Factory.add_goal_check(ctx, :check2, :goal, name: "Checklist Item 2", completed: true)

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Checklist"
    assert rendered =~ "- [ ] Checklist Item 1"
    assert rendered =~ "- [x] Checklist Item 2"
  end

  test "it renders checklist with completion timestamps when available", ctx do
    ctx = Factory.add_goal_check(ctx, :check1, :goal, name: "Checklist Item 1", completed: false)
    ctx = Factory.add_goal_check(ctx, :check2, :goal, name: "Checklist Item 2", completed: true)

    # Add a goal_check_toggled activity
    Factory.insert!(:activity, 
      resource_id: ctx.goal.id,
      action: "goal_check_toggled",
      author: ctx.creator,
      content: %{
        "name" => "Checklist Item 2",
        "completed" => true
      }
    )

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Checklist"
    assert rendered =~ "- [ ] Checklist Item 1"
    assert rendered =~ "- [x] Checklist Item 2 (completed by #{ctx.creator.full_name} on"
  end

  test "it renders discussions", ctx do
    message = Operately.Support.RichText.rich_text("This is a discussion about the goal.")
    ctx = Factory.add_goal_discussion(ctx, :discussion, :goal, title: "Discussion Title", message: message)
    ctx = Factory.add_reactions(ctx, :reaction, :discussion, emoji: "👍")

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Discussions"
    assert rendered =~ "Discussion Title"
    assert rendered =~ "This is a discussion about the goal."
    assert rendered =~ "#{ctx.creator.full_name}: 👍"
  end

  test "it renders discussion comments", ctx do
    message = Operately.Support.RichText.rich_text("This is a discussion about the goal.")
    ctx = Factory.add_goal_discussion(ctx, :discussion, :goal, title: "Discussion Title", message: message)
    ctx = Factory.add_comment(ctx, :comment, :discussion)
    ctx = Factory.add_reactions(ctx, :reaction, :comment, emoji: "👍")

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Discussions"
    assert rendered =~ "Discussion Title"
    assert rendered =~ "This is a discussion about the goal."
    assert rendered =~ "## Comments"
    assert rendered =~ "### Comment by #{ctx.creator.full_name} on #{Operately.Time.as_date(ctx.comment.inserted_at) |> Date.to_iso8601()}"
    assert rendered =~ "#{ctx.creator.full_name}: 👍"
  end

  test "it renders activity timeline with timestamps", ctx do
    # Add activities
    Factory.insert!(:activity, 
      resource_id: ctx.goal.id,
      action: "goal_check_toggled",
      author: ctx.creator,
      content: %{
        "name" => "Test Checklist Item",
        "completed" => true
      }
    )

    Factory.insert!(:activity, 
      resource_id: ctx.goal.id,
      action: "goal_timeframe_editing",
      author: ctx.creator,
      content: %{
        "old_timeframe" => %{"contextual_end_date" => %{"value" => "2024-12-01"}},
        "new_timeframe" => %{"contextual_end_date" => %{"value" => "2024-12-15"}}
      }
    )

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Activity Timeline"
    assert rendered =~ "completed checklist item \"Test Checklist Item\""
    assert rendered =~ "changed due date from 2024-12-01 to 2024-12-15"
    assert rendered =~ ctx.creator.full_name
  end
end
