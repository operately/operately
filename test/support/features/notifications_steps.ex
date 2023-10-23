defmodule Operately.Support.Features.NotificationsSteps do
  alias Operately.FeatureCase.UI

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
    UI.refute_has(ctx, testid: "unread-notifications-count")
  end

end
