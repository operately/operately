defmodule Operately.Features.ProjectCheckIns.CommentsAndAccessTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectCheckInsCase

  feature "leave a comment on an check-in", ctx do
    values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(values)
    |> Steps.log_in_as_reviewer()
    |> Steps.open_check_in_from_notifications()
    |> Steps.leave_comment_on_check_in()
    |> Steps.assert_check_in_comment_visible_on_feed()
    |> Steps.assert_comment_on_check_in_received_in_notifications()
    |> Steps.assert_comment_on_check_in_received_in_email()
  end

  feature "copy comment link shows success message", ctx do
    check_in_values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(check_in_values)
    |> Steps.leave_comment_on_check_in()
    |> Steps.copy_comment_link()
    |> Steps.assert_comment_link_copied_message()
  end

  feature "delete comment from check-in", ctx do
    check_in_values = %{status: "on_track", description: "This is a check-in."}

    ctx
    |> Steps.submit_check_in(check_in_values)
    |> Steps.leave_comment_on_check_in()
    |> Steps.delete_comment()
    |> Steps.assert_comment_deleted()
    |> Steps.assert_project_check_in_comment_visible_on_feed_after_deletion()
  end

  describe "project check-in pages preload access" do
    feature "project check-in new page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_project_in_secret_space_for_champion()
      |> Steps.visit_project_check_in_new_page(:secret_project)
      |> Steps.assert_check_in_new_navigation_without_space()
    end

    feature "project check-in page hides space navigation when space is not accessible", ctx do
      values = %{status: "on_track", description: "This is a check-in.", project_key: :secret_project}

      ctx
      |> Steps.given_project_in_secret_space_for_champion()
      |> Steps.submit_check_in(values)
      |> Steps.assert_check_in_navigation_without_space()
    end
  end
end
