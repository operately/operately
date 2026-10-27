defmodule Operately.Support.Features.ProjectMilestones.CompletionShortcutsSteps do
  use Operately.FeatureCase

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project, title: "Launch")
    |> Factory.log_in_person(:creator)
  end

  step :add_task, ctx do
    Factory.add_project_task(ctx, :task, :milestone)
  end

  step :visit_tasks, ctx do
    UI.visit(ctx, Paths.project_path(ctx.company, ctx.project, tab: "tasks"))
  end

  step :complete_from_tasks, ctx do
    ctx
    |> UI.find(UI.query(testid: "tasks-board"), fn element ->
      element
      |> UI.hover(css: "div[data-test-id^=milestone-]")
      |> UI.click(testid: "complete-milestone")
    end)
    |> UI.assert_has(testid: "complete-milestone-modal")
  end

  step :complete_empty_from_tasks, ctx do
    ctx
    |> UI.find(UI.query(testid: "tasks-board"), fn element ->
      element
      |> UI.hover(css: "div[data-test-id^=milestone-]")
      |> UI.click(testid: "complete-milestone")
    end)
    |> UI.refute_has(testid: "complete-milestone")
    |> UI.refute_has(testid: "complete-milestone-modal")
  end

  step :assert_completed_in_tasks, ctx do
    ctx
    |> UI.click(testid: "completed-milestones-toggle")
    |> UI.assert_has(css: "[data-test-id^=completed-milestone-]")
  end

  step :choose_closed_status, ctx do
    UI.click(ctx, testid: "resolutionAction-set_status")
  end

  step :submit_resolution, ctx do
    ctx
    |> UI.click(css: "[data-test-id=complete-milestone-form] button[type=submit]")
    |> UI.refute_has(testid: "complete-milestone-modal")
    |> UI.refute_has(testid: "complete-milestone")
    |> UI.assert_page(Paths.project_path(ctx.company, ctx.project))
  end

  step :assert_task_moved_out, ctx do
    task = Operately.Repo.reload!(ctx.task)
    assert is_nil(task.milestone_id)
    assert is_nil(task.closed_at)
    ctx
  end

  step :assert_task_closed, ctx do
    task = Operately.Repo.reload!(ctx.task)
    assert task.milestone_id == ctx.milestone.id
    assert task.task_status.closed
    ctx
  end

  step :assert_completed, ctx do
    assert Operately.Repo.reload!(ctx.milestone).status == :done
    ctx
  end
end
