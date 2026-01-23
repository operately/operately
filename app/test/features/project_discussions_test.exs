defmodule Operately.Features.ProjectDiscussionTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectDiscussionSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "listing project discussions", ctx do
    ctx
    |> Steps.given_several_discussions_exist()
    |> Steps.visit_project_page()
    |> Steps.assert_discussion_listed()
  end

  feature "view a discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.visit_project_page()
    |> Steps.click_on_discussion()
    |> Steps.assert_discussion_page_displayed()
  end

  feature "commenting on a discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.visit_discussion_page()
    |> Steps.leave_comment("This is a comment")
    |> Steps.assert_comment_submitted("This is a comment")
    |> Steps.assert_comment_email_sent()
    |> Steps.assert_comment_notification_sent()
    |> Steps.assert_comment_feed_posted()
  end

  feature "delete comment from discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.visit_discussion_page()
    |> Steps.leave_comment("This is a comment")
    |> Steps.delete_comment("This is a comment")
    |> Steps.assert_comment_deleted()
    |> Steps.assert_comment_feed_posted_after_deletion()
  end

  feature "writing a new discussion", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.click_new_discussion()
    |> Steps.fill_in_discussion_title("New Discussion")
    |> Steps.fill_in_discussion_content("Discussion content goes here")
    |> Steps.submit_discussion()
    |> Steps.assert_discussion_created("New Discussion")
    |> Steps.assert_new_discussion_feed_posted()
    |> Steps.assert_new_discussion_notification_sent()
    |> Steps.assert_new_discussion_email_sent()
  end

  feature "editing a discussion", ctx do
    ctx
    |> Steps.given_a_discussion_exists()
    |> Steps.visit_discussion_page()
    |> Steps.click_edit_discussion()
    |> Steps.fill_in_discussion_content("Updated content")
    |> Steps.save_discussion_edit()
    |> Steps.assert_discussion_updated("Updated content")
  end

  describe "project discussions pages preload access" do
    feature "project discussion new page hides space navigation when space is not accessible", ctx do
      ctx
      |> Steps.given_project_in_secret_space_for_champion()
      |> Steps.visit_project_page(:secret_project)
      |> Steps.click_new_discussion()
      |> Steps.assert_project_discussion_new_navigation_without_space()
    end

    feature "creating a project discussion works when space is not accessible", ctx do
      ctx
      |> Steps.given_project_in_secret_space_for_champion()
      |> Steps.visit_project_page(:secret_project)
      |> Steps.click_new_discussion()
      |> Steps.fill_in_discussion_title("Secret discussion")
      |> Steps.fill_in_discussion_content("Discussion content goes here")
      |> Steps.submit_discussion()
      |> Steps.assert_project_discussion_navigation_without_space()
    end
  end

  describe "discussion subscriber permissions" do
    feature "user with edit access can edit discussion subscribers", ctx do
      ctx
      |> Steps.given_project_with_edit_access_contributor()
      |> Steps.given_a_discussion_exists()
      |> Steps.login_as_editor()
      |> Steps.visit_discussion_page()
      |> Steps.assert_can_edit_subscribers()
    end

    feature "user with comment access cannot see edit subscribers button", ctx do
      ctx
      |> Steps.given_project_with_comment_access_contributor()
      |> Steps.given_a_discussion_exists()
      |> Steps.login_as_commenter()
      |> Steps.visit_discussion_page()
      |> Steps.assert_cannot_edit_subscribers()
    end
  end
end
