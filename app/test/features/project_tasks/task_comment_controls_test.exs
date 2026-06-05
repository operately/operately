defmodule Operately.Features.ProjectTasks.TaskCommentControlsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectTasksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :commenter
  feature "delete task comment", ctx do
    ctx
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_has_comment()
    |> Steps.visit_task_page()
    |> Steps.assert_comment("Content")
    |> Steps.delete_comment()
    |> Steps.assert_comment_deleted()
    |> Steps.reload_task_page()
    |> Steps.assert_comment_deleted()
  end

  @tag login_as: :champion
  feature "comment edit and delete not visible to other users on task", ctx do
    ctx
    |> Steps.given_task_exists()
    |> Steps.given_task_has_comment()
    |> Steps.given_space_member_exists()
    |> Factory.log_in_person(:space_member)
    |> Steps.visit_task_page()
    |> Steps.assert_comment("Content")
    |> Steps.assert_comment_edit_delete_not_visible()
  end

  @tag login_as: :viewer
  feature "copy comment link shows success message", ctx do
    ctx
    |> Steps.assert_viewer_has_view_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_has_comment()
    |> Steps.visit_task_page()
    |> Steps.assert_comment("Content")
    |> Steps.copy_comment_link()
    |> Steps.assert_comment_link_copied_message()
  end

  @tag login_as: :viewer
  feature "task page activity feed handles deleted milestone gracefully", ctx do
    ctx
    |> Steps.assert_viewer_has_view_access()
    |> Steps.given_task_exists()
    |> Steps.given_task_feed_references_a_deleted_milestone()
    |> Steps.visit_task_page()
    |> Steps.assert_page_loads_without_errors()
  end
end
