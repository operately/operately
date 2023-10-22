defmodule Operately.Support.Features.NotificationsSteps do
  alias Operately.FeatureCase.UI

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  def visit_notifications_page(ctx) do
    UI.visit(ctx, "/notifications")
  end

  def assert_notification_exists(ctx, author: author, subject: subject) do
    ctx
    |> UI.assert_text(author.full_name)
  end
end
