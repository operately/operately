defmodule Operately.MD.ProjectTest do
  use Operately.DataCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:project, :marketing)
  end

  test "it renders discussions in the markdown", ctx do
    ctx = Factory.add_project_discussion(ctx, :discussion, :project)

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Discussions"
    assert rendered =~ ctx.discussion.title
    assert rendered =~ ctx.creator.full_name
  end

  test "it includes timestamps for discussion messages", ctx do
    ctx = Factory.add_project_discussion(ctx, :discussion, :project)

    rendered = Operately.MD.Project.render(ctx.project)

    # Check that timestamp is included in the discussions section
    assert rendered =~ "Posted on:"

    # Check that the actual date is rendered (using the render_date format)
    expected_date = ctx.discussion.inserted_at |> Operately.Time.as_date() |> Date.to_iso8601()
    assert rendered =~ expected_date
  end

  test "it includes comments on check-ins with timestamps", ctx do
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator)
    ctx = Factory.preload(ctx, :check_in, :project)
    ctx = Factory.add_comment(ctx, :comment, :check_in)

    rendered = Operately.MD.Project.render(ctx.project)

    # Check that the check-in is rendered
    assert rendered =~ "## Check-ins"

    # Check that comments section is included
    assert rendered =~ "#### Comments"

    # Check that the comment author and timestamp are included
    assert rendered =~ ctx.creator.full_name

    # Check that the comment timestamp is rendered
    expected_date = ctx.comment.inserted_at |> Operately.Time.as_date() |> Date.to_iso8601()
    assert rendered =~ expected_date
  end

  test "it renders check-ins without comments correctly", ctx do
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator)

    rendered = Operately.MD.Project.render(ctx.project)

    # Check that the check-in is rendered
    assert rendered =~ "## Check-ins"

    # Check that no comments section is included when there are no comments
    refute rendered =~ "#### Comments"
  end

  test "it renders milestones in the markdown", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
  end

  test "it includes completion timestamp for completed milestones", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)
    ctx = Factory.close_project_milestone(ctx, :milestone)

    rendered = Operately.MD.Project.render(ctx.project)

    # Check that the milestone is rendered
    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
    assert rendered =~ "Status: done"

    # Check that completion timestamp is included
    assert rendered =~ "Completed:"

    # Check that the actual completion date is rendered
    milestone = Operately.Repo.reload(ctx.milestone)
    expected_date = milestone.completed_at |> Operately.Time.as_date() |> Date.to_iso8601()
    assert rendered =~ expected_date
  end

  test "it does not include completion timestamp for pending milestones", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    rendered = Operately.MD.Project.render(ctx.project)

    # Check that the milestone is rendered
    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
    assert rendered =~ "Status: pending"

    # Check that completion timestamp is not included for pending milestones
    refute rendered =~ "Completed:"
  end

  test "it renders parent goal when project is linked to a goal", ctx do
    ctx = Factory.add_goal(ctx, :goal, :marketing, name: "Marketing Goal")
    ctx = Factory.add_project(ctx, :project_with_goal, :marketing, goal: :goal)

    rendered = Operately.MD.Project.render(ctx.project_with_goal)

    assert rendered =~ "Parent Goal: Marketing Goal"
    refute rendered =~ "Company-wide project"
  end

  test "it renders company-wide project when no goal is linked", ctx do
    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "Parent Goal: None (Company-wide project)"
    refute rendered =~ "Parent Goal: Marketing Goal"
  end

  test "it renders project overview information", ctx do
    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "# #{ctx.project.name}"
    assert rendered =~ "Status:"
    assert rendered =~ "Progress:"
    assert rendered =~ "Space: #{ctx.marketing.name}"
    assert rendered =~ "Created:"
    assert rendered =~ "Last Updated:"
    assert rendered =~ "Parent Goal: None (Company-wide project)"
  end
end
