defmodule Operately.Support.Features.NotificationsSteps do
  alias Operately.FeatureCase.UI
  alias Operately.People.Person

  def visit_notifications_page(ctx) do
    UI.visit(ctx, "/notifications")
  end

  def click_on_first_notification(ctx) do
    UI.click(ctx, testid: "notification-card")
  end

  def assert_notification_exists(ctx, author: author, subject: subject) do
    ctx
    |> UI.assert_text(author.full_name)
    |> UI.assert_text(subject)
  end

  def assert_notification_count(ctx, count) do
    UI.assert_has(ctx, testid: "unread-notifications-count")

    bell = UI.query(testid: "notifications-bell")

    UI.find(ctx, bell, fn el -> UI.assert_text(el, "#{count}") end)
  end

  def assert_no_unread_notifications(ctx) do
    :timer.sleep(500) # give the notification count time to update
    UI.refute_has(ctx, testid: "unread-notifications-count")
  end

  def assert_project_created_notification_sent(ctx, author: author, role: role) do
    name = Person.first_name(author)

    ctx 
    |> visit_notifications_page()
    |> assert_notification_exists(author: author, subject: "#{name} created a new project and assigned you as the #{role}")
  end

end
