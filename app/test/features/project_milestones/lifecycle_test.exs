defmodule Operately.Features.ProjectMilestones.LifecycleTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectMilestonesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)
  setup ctx, do: Steps.setup_milestone(ctx)

  feature "mark milestone as completed", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.mark_milestone_as_completed()
    |> Steps.assert_milestone_status("Completed")
    |> Steps.assert_activity_added_to_feed("completed the milestone")
    |> Steps.reload_milestone_page()
    |> Steps.assert_milestone_status("Completed")
    |> Steps.assert_activity_added_to_feed("completed the milestone")
  end

  feature "mark milestone as completed updates project page", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_tasks_tab_on_project_page()
    |> Steps.assert_milestone_visible_in_tasks_board(name: ctx.milestone.title)
    |> Steps.navigate_to_milestone(name: ctx.milestone.title)
    |> Steps.mark_milestone_as_completed()
    |> Steps.assert_milestone_status("Completed")
    |> Steps.assert_activity_added_to_feed("completed the milestone")
    |> Steps.navigate_to_tasks_board()
    |> Steps.refute_milestone_visible_in_tasks_board(name: ctx.milestone.title)
    |> Steps.assert_milestone_visible_in_completed_tasks_board(name: ctx.milestone.title)
  end

  feature "reopen milestone", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_that_milestone_is_completed()
    |> Steps.visit_milestone_page()
    |> Steps.reopen_milestone()
    |> Steps.assert_milestone_status("Active")
    |> Steps.assert_activity_added_to_feed("re-opened the milestone")
    |> Steps.reload_milestone_page()
    |> Steps.assert_milestone_status("Active")
    |> Steps.assert_activity_added_to_feed("re-opened the milestone")
  end

  feature "reopen milestone updates project page", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_that_milestone_is_completed()
    |> Steps.visit_tasks_tab_on_project_page()
    |> Steps.refute_milestone_visible_in_tasks_board(name: ctx.milestone.title)
    |> Steps.assert_milestone_visible_in_completed_tasks_board(name: ctx.milestone.title)
    |> Steps.visit_milestone_page()
    |> Steps.reopen_milestone()
    |> Steps.assert_milestone_status("Active")
    |> Steps.assert_activity_added_to_feed("re-opened the milestone")
    |> Steps.navigate_to_tasks_board()
    |> Steps.assert_milestone_visible_in_tasks_board(name: ctx.milestone.title)
    |> Steps.refute_milestone_visible_in_completed_tasks_board(name: ctx.milestone.title)
  end

  feature "add a task", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.add_task(name: "My task")
    |> Steps.assert_task_created(name: "My task")
    |> Steps.assert_activity_added_to_feed("created \"My task\"")
    |> Steps.reload_milestone_page()
    |> Steps.assert_task_created(name: "My task")
    |> Steps.assert_activity_added_to_feed("created \"My task\"")
  end

  feature "add multiple tasks", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.add_multiple_tasks(names: ["1st task", "2nd task"])
    |> Steps.assert_add_task_form_closed()
    |> Steps.assert_task_created(name: "1st task")
    |> Steps.assert_task_created(name: "2nd task")
    |> Steps.assert_activity_added_to_feed("created \"1st task\"")
    |> Steps.assert_activity_added_to_feed("created \"2nd task\"")
    |> Steps.reload_milestone_page()
    |> Steps.assert_task_created(name: "1st task")
    |> Steps.assert_task_created(name: "2nd task")
    |> Steps.assert_activity_added_to_feed("created \"1st task\"")
    |> Steps.assert_activity_added_to_feed("created \"2nd task\"")
  end

  feature "delete milestone", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.delete_milestone()
    |> Steps.assert_redirected_to_project_page()
    |> Steps.assert_milestone_deleted()
    |> Steps.assert_milestone_deleted_visible_in_feed()
  end

  feature "delete milestone when project doesn't have champion", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_that_milestone_project_doesnt_have_champion()
    |> Steps.visit_milestone_page()
    |> Steps.delete_milestone()
    |> Steps.assert_redirected_to_project_page()
    |> Steps.assert_milestone_deleted()
  end
end
