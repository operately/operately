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

  test "it renders milestones in the markdown", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
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
