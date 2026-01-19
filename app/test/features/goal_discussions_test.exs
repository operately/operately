defmodule Operately.Features.GoalDiscussionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalDiscussionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @discussion_params %{title: "New goal discussion", message: "Let's do this!"}

  @tag login_as: :champion
  feature "start a new goal discussion", ctx do
    ctx
    |> Steps.start_new_discussion(@discussion_params)
    |> Steps.assert_discussion_submitted(@discussion_params)
    |> Steps.assert_discussion_submitted_email_sent()
    |> Steps.assert_discussion_submitted_feed_posted()
    |> Steps.assert_discussion_submitted_notification_sent()
  end

  @tag login_as: :champion
  feature "edit a posted discussion", ctx do
    edits = %{title: "Updated goal discussion", message: "Let's do this updated!"}

    ctx
    |> Steps.start_new_discussion(@discussion_params)
    |> Steps.assert_discussion_submitted(@discussion_params)
    |> Steps.edit_discussion(edits)
    |> Steps.assert_discusssion_edited(edits)
  end

  @tag login_as: :champion
  feature "commenting on a posted discussion", ctx do
    ctx
    |> Steps.start_new_discussion(@discussion_params)
    |> Steps.comment_on_discussion("Great idea!")
    |> Steps.assert_comment_submitted("Great idea!")
    |> Steps.assert_comment_submitted_email_sent()
    |> Steps.assert_comment_submitted_feed_posted()
    |> Steps.assert_comment_submitted_notification_sent()
  end

  @tag login_as: :champion
  feature "delete comment from discussion", ctx do
    ctx
    |> Steps.start_new_discussion(%{title: "Test Discussion", message: "Test message"})
    |> Steps.leave_comment("This is a comment")
    |> Steps.delete_comment("This is a comment")
    |> Steps.assert_comment_deleted()
    |> Steps.assert_comment_feed_posted_after_deletion()
  end

  @tag login_as: :champion
  feature "navigation has complete breadcrumb", ctx do
    ctx
    |> Steps.start_new_discussion(@discussion_params)
    |> Steps.assert_navigation_shows_space_and_goal()
    |> Steps.navigate_to_goal_from_discussion()
    |> Steps.assert_goal_discussions_tab()
  end

  describe "goal discussions pages preload access" do
    @tag login_as: :champion
    feature "goal discussion new page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_goal_in_secret_space_for_champion()
      |> Steps.visit_new_discussion_page()
      |> Steps.assert_goal_discussion_new_navigation_without_space()
    end

    @tag login_as: :champion
    feature "creating a goal discussion works when space is not accessible", ctx do
      params = %{title: "New goal discussion", message: "Let's do this!", goal_key: :secret_goal}

      ctx
      |> Steps.given_goal_in_secret_space_for_champion()
      |> Steps.start_new_discussion(params)
      |> Steps.assert_goal_discussion_navigation_without_space()
    end
  end
end
