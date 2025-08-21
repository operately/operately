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

  test "it renders check-ins without role prefix", ctx do
    message = Operately.Support.RichText.rich_text("Great progress on the goal this week.")
    ctx = Factory.add_goal_update(ctx, :update, :goal, :creator, message: message)

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Check-ins"
    # Should contain person name without "Author:" prefix
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ ctx.creator.title
    # Should NOT contain "Author:" prefix
    refute rendered =~ "Author: #{ctx.creator.full_name}"
  end

  test "it renders discussions without role prefix in goal discussions", ctx do
    message = Operately.Support.RichText.rich_text("Let's discuss the goal strategy.")
    ctx = Factory.add_goal_discussion(ctx, :discussion, :goal, title: "Strategy Discussion", message: message)

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## Discussions"
    assert rendered =~ "Strategy Discussion"
    # Should contain person name without "Author:" prefix
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ ctx.creator.title
    # Should NOT contain "Author:" prefix in discussions
    refute rendered =~ "Author: #{ctx.creator.full_name}"
  end

  test "it still shows roles in people section", ctx do
    # Set champion and reviewer
    champion = ctx.creator
    ctx = Factory.add_company_member(ctx, :reviewer, full_name: "Jane Reviewer", title: "Engineering Manager")
    
    goal = ctx.goal 
    |> Ecto.Changeset.change(%{champion_id: champion.id, reviewer_id: ctx.reviewer.id})
    |> Operately.Repo.update!()
    
    ctx = Map.put(ctx, :goal, goal)

    rendered = Operately.MD.Goal.render(ctx.goal)

    assert rendered =~ "## People Involved"
    # Should show roles in people section
    assert rendered =~ "Champion: #{champion.full_name} (#{champion.title})"
    assert rendered =~ "Reviewer: #{ctx.reviewer.full_name} (#{ctx.reviewer.title})"
  end
end
