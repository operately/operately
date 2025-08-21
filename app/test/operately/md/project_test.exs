defmodule Operately.MD.ProjectTest do
  use Operately.DataCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:project, :marketing)
  end

  test "it renders discussions with timestamps in the markdown", ctx do
    ctx = Factory.add_project_discussion(ctx, :discussion, :project)

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Discussions"
    assert rendered =~ ctx.discussion.title
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ "Published on:"
  end

  test "it renders milestones with completion timestamps in the markdown", ctx do
    # Create a milestone and mark it as completed
    ctx = Factory.add_project_milestone(ctx, :milestone, :project, status: :done, completed_at: ~U[2023-12-25 10:00:00Z])

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
    assert rendered =~ "Status: done"
    assert rendered =~ "Completed: 2023-12-25"
  end

  test "it renders check-in comments with timestamps in the markdown", ctx do
    # Create a check-in
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator)
    
    # Add a comment to the check-in
    ctx = Factory.add_comment(ctx, :comment, :check_in)

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Check-ins"
    assert rendered =~ "#### Comments"
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ "Content" # Default content from factory
  end

  test "it renders timeline editing activities with timestamps in the markdown", ctx do
    # Create a timeline editing activity
    {:ok, _activity} = Operately.Repo.insert(%Operately.Activities.Activity{
      action: "project_timeline_edited",
      author_id: ctx.creator.id,
      content: %{
        "project_id" => ctx.project.id,
        "company_id" => ctx.company.id,
        "space_id" => ctx.marketing.id,
        "old_start_date" => "2023-01-01",
        "new_start_date" => "2023-02-01",
        "old_end_date" => "2023-06-30",
        "new_end_date" => "2023-07-31",
        "milestone_updates" => [],
        "new_milestones" => []
      }
    })

    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "## Timeline Editing Activities"
    assert rendered =~ "Timeline edited on"
    assert rendered =~ ctx.creator.full_name
    assert rendered =~ "Start date changed from 2023-01-01 to 2023-02-01"
    assert rendered =~ "End date changed from 2023-06-30 to 2023-07-31"
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
