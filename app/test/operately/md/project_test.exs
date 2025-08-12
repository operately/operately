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
end
