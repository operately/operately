defmodule Operately.Features.ProjectMilestones.CommentsManagementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectMilestonesCase

  setup ctx do
    Steps.given_that_a_milestone_exists(ctx, "My milestone")
  end

  feature "edit milestone comment", ctx do
    new_comment = "Edited comment"

    ctx
    |> Steps.given_that_milestone_has_comment()
    |> Steps.log_in_as_commenter()
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.visit_milestone_page()
    |> Steps.assert_comment("Content")
    |> Steps.edit_comment(new_comment)
    |> Steps.assert_comment(new_comment)
    |> Steps.reload_milestone_page()
    |> Steps.assert_comment(new_comment)
  end

  feature "delete milestone comment", ctx do
    ctx
    |> Steps.log_in_as_commenter()
    |> Steps.assert_commenter_has_comment_access()
    |> Steps.given_that_milestone_has_comment()
    |> Steps.visit_milestone_page()
    |> Steps.assert_comment("Content")
    |> Steps.delete_comment()
    |> Steps.assert_comment_deleted()
    |> Steps.reload_milestone_page()
    |> Steps.assert_comment_deleted()
  end

  feature "comment edit and delete not visible to other users", ctx do
    ctx
    |> Steps.given_that_milestone_has_comment()
    |> Steps.log_in_as_champion()
    |> Steps.visit_milestone_page()
    |> Steps.assert_comment("Content")
    |> Steps.assert_comment_edit_delete_not_visible()
  end

  feature "copy comment link shows success message", ctx do
    ctx
    |> Steps.given_that_milestone_has_comment()
    |> Steps.log_in_as_viewer()
    |> Steps.assert_viewer_has_view_access()
    |> Steps.visit_milestone_page()
    |> Steps.assert_comment("Content")
    |> Steps.copy_comment_link()
    |> Steps.assert_comment_link_copied_message()
  end
end
