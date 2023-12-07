defmodule Operately.Support.Features.NotificationsSteps do
  alias Operately.Support.Features.UI
  alias Operately.People.Person

  def visit_notifications_page(ctx) do
    UI.visit(ctx, "/notifications")
  end

  def click_on_first_notification(ctx) do
    UI.click(ctx, testid: "notification-card")
  end

  def click_on_first_mark_all_as_read(ctx) do
    UI.click(ctx, testid: "mark-all-read")
  end

  def assert_notification_exists(ctx, author: author, subject: subject) do
    ctx
    |> visit_notifications_page()
    |> UI.assert_text(author.full_name)
    |> UI.assert_text(subject)
  end

  def assert_notification_count(ctx, count) do
    bell = UI.query(testid: "notifications-bell")

    ctx
    |> UI.assert_has(testid: "unread-notifications-count")
    |> UI.find(bell, fn el -> UI.assert_text(el, "#{count}") end)
  end

  def assert_no_unread_notifications(ctx) do
    :timer.sleep(500) # give the notification count time to update
    UI.refute_has(ctx, testid: "unread-notifications-count")
  end

  def assert_project_moved_sent(ctx, author: author, old_space: old_space, new_space: new_space) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} moved this project from #{old_space.name} to #{new_space.name}")
  end

  def assert_project_retrospective_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} closed this project and submitted a retrospective")
  end

  def assert_project_review_request_notification(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} requested a review")
  end

  def assert_project_review_acknowledged_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} acknowledged your review")
  end

  def assert_project_review_commented_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} commented on the project review")
  end

  def assert_project_status_update_submitted_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} submitted a status update")
  end

  def assert_project_created_notification_sent(ctx, author: author, role: role) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} created a new project and assigned you as the #{role}")
  end

  def assert_goal_created_sent(ctx, author: author, role: role) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} added a new goal and assigned you as the #{role}")
  end

  def assert_project_archived_sent(ctx, author: author, project: project) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} archived the #{project.name} project")
  end

  def assert_project_update_acknowledged_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} acknowledged your status update")
  end

  def assert_project_update_submitted_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} started a new discussion: #{title}")
  end

  def assert_project_update_commented_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} commented on the project status update")
  end

  def assert_discussion_commented_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} commented on: #{title}")
  end

  def assert_project_timeline_edited_sent(ctx, author: author) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} changed the project timeline")
  end

  def assert_milestone_comment_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} commented on: #{title}")
  end

  def assert_milestone_completed_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} completed: #{title}")
  end

  def assert_milestone_reopened_sent(ctx, author: author, title: title) do
    ctx |> assert_notification_exists(author: author, subject: "#{Person.first_name(author)} re-opened: #{title}")
  end

end
