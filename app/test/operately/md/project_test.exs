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

  test "it renders check-ins without role prefix", ctx do
    description = Operately.Support.RichText.rich_text("Project is progressing well this week.")
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator, description: description)

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Check-ins"
    # Should contain person name without "Author:" prefix
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ ctx.creator.title
    # Should NOT contain "Author:" prefix
    refute rendered =~ "Author: #{ctx.creator.full_name}"
  end

  test "it renders discussions without role prefix", ctx do
    message = Operately.Support.RichText.rich_text("Let's discuss the project roadmap.")
    ctx = Factory.add_project_discussion(ctx, :discussion, :project, title: "Roadmap Discussion", message: message)

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Discussions"
    assert rendered =~ "Roadmap Discussion"
    # Should contain person name without "Author:" prefix
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ ctx.creator.title
    # Should NOT contain "Author:" prefix in discussions
    refute rendered =~ "Author: #{ctx.creator.full_name}"
  end

  test "it still shows roles in contributors section", ctx do
    # Add contributors with roles
    ctx = Factory.add_project_contributor(ctx, :champion, :project, role: "Champion")
    ctx = Factory.add_project_contributor(ctx, :reviewer, :project, role: "Reviewer")

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Contributors"
    # Should show roles in contributors section
    assert rendered =~ "Champion:"
    assert rendered =~ "Reviewer:"
  end
end
