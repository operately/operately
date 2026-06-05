defmodule Operately.Features.Discussions.CollaborationAndPermissionsTest do
  use Operately.FeatureCase
  use Operately.Support.Features.DiscussionsCase

  feature "leave a comment on a discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.leave_a_comment()
    |> Steps.assert_comment_notification_and_email_sent()
    |> Steps.assert_comment_is_listed_in_the_feed()
  end

  feature "delete comment from discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.leave_a_comment()
    |> Steps.delete_comment()
    |> Steps.assert_comment_deleted()
    |> Steps.assert_comment_is_listed_in_the_feed()
  end

  describe "permissions" do
    feature "'New discussion' button is hidden if user has no permissions", ctx do
      ctx
      |> Steps.given_comment_access_member()
      |> Steps.login_as_commenter()
      |> Steps.visit_the_discussion_board()
      |> Steps.assert_new_discussion_button_not_visible()
    end
  end
end
