defmodule Operately.Features.Discussions.CollaborationAndPermissionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.DiscussionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

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

  feature "comment counts refresh when returning to the cached discussion list", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.set_page_reload_marker()
    |> Steps.assert_published_on_cached_board()
    |> Steps.open_posted_discussion()
    |> Steps.comment_as_author()
    |> Steps.assert_comment_count_on_cached_board(1)
    |> Steps.open_posted_discussion()
    |> Steps.delete_comment()
    |> Steps.assert_comment_count_on_cached_board(0)
    |> Steps.assert_page_was_not_reloaded()
  end

  feature "reactions persist through cached navigation without reloading", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.set_page_reload_marker()
    |> Steps.add_discussion_reaction()
    |> Steps.return_to_discussion_board()
    |> Steps.open_posted_discussion()
    |> Steps.assert_discussion_reaction()
    |> Steps.remove_discussion_reaction()
    |> Steps.return_to_discussion_board()
    |> Steps.open_posted_discussion()
    |> Steps.assert_no_discussion_reaction()
    |> Steps.assert_page_was_not_reloaded()
  end

  feature "opening a discussion clears its notification", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.open_discussion_with_unread_notification()
    |> Steps.set_page_reload_marker()
    |> Steps.assert_discussion_notification_read()
    |> Steps.assert_page_was_not_reloaded()
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
