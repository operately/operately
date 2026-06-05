defmodule Operately.Features.Projects.PeopleTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectsCase

  setup ctx do
    ctx
    |> Steps.setup()
    |> Steps.setup_contributors()
  end

  feature "changing project name", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.change_project_name()
    |> Steps.assert_project_name_changed()
    |> Steps.assert_project_name_changed_feed_posted()
  end

  feature "changing the champion", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.change_champion(name: ctx.champion.full_name)
    |> Steps.assert_champion_changed(name: ctx.champion.full_name)
    |> Steps.assert_champion_changed_feed_posted(champion: ctx.champion)
  end

  feature "changing the champion sends notification to subscribers", ctx do
    ctx
    |> Steps.given_subscriber_exists()
    |> Steps.log_in_as_subscriber()
    |> Steps.visit_project_page()
    |> Steps.subscribe_to_project()
    |> Steps.log_in_as_creator()
    |> Steps.visit_project_page()
    |> Steps.change_champion(name: ctx.champion.full_name)
    |> Steps.assert_champion_change_notification_sent_to_subscriber()
    |> Steps.assert_champion_change_email_sent_to_subscriber()
  end

  feature "removing the champion", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.remove_champion()
    |> Steps.assert_champion_removed()
    |> Steps.assert_champion_removed_feed_posted()
  end

  feature "removing the champion sends notification to subscribers", ctx do
    ctx
    |> Steps.given_subscriber_exists()
    |> Steps.log_in_as_subscriber()
    |> Steps.visit_project_page()
    |> Steps.subscribe_to_project()
    |> Steps.log_in_as_creator()
    |> Steps.visit_project_page()
    |> Steps.remove_champion()
    |> Steps.assert_champion_removed_notification_sent_to_subscriber()
    |> Steps.assert_champion_removed_email_sent_to_subscriber()
  end

  feature "changing the reviewer", ctx do
    ctx
    |> Steps.given_project_with_reviewer_exists()
    |> Steps.visit_project_page()
    |> Steps.change_reviewer(name: ctx.reviewer.full_name)
    |> Steps.assert_reviewer_changed(name: ctx.reviewer.full_name)
    |> Steps.assert_reviewer_changed_feed_posted(reviewer: ctx.reviewer)
  end

  feature "changing the reviewer sends notification to subscribers", ctx do
    ctx
    |> Steps.given_project_with_reviewer_exists()
    |> Steps.given_subscriber_exists()
    |> Steps.log_in_as_subscriber()
    |> Steps.visit_project_page()
    |> Steps.subscribe_to_project()
    |> Steps.log_in_as_creator()
    |> Steps.visit_project_page()
    |> Steps.change_reviewer(name: ctx.reviewer.full_name)
    |> Steps.assert_reviewer_change_notification_sent_to_subscriber()
    |> Steps.assert_reviewer_change_email_sent_to_subscriber()
  end

  feature "removing the reviewer", ctx do
    ctx
    |> Steps.given_project_with_reviewer_exists()
    |> Steps.visit_project_page()
    |> Steps.remove_reviewer()
    |> Steps.assert_reviewer_removed()
    |> Steps.assert_reviewer_removed_feed_posted()
  end

  feature "removing the reviewer sends notification to subscribers", ctx do
    ctx
    |> Steps.given_project_with_reviewer_exists()
    |> Steps.given_subscriber_exists()
    |> Steps.log_in_as_subscriber()
    |> Steps.visit_project_page()
    |> Steps.subscribe_to_project()
    |> Steps.log_in_as_creator()
    |> Steps.visit_project_page()
    |> Steps.remove_reviewer()
    |> Steps.assert_reviewer_change_notification_sent_to_subscriber()
    |> Steps.assert_reviewer_removed_email_sent_to_subscriber()
  end
end
