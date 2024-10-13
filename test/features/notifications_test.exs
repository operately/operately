defmodule Operately.Features.NotificationsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access.Binding
  alias Operately.Support.Features.NotificationsSteps, as: Steps

  setup ctx do
    # Reset notifications
    Operately.Notifications.clear_all()
    
    ctx = Map.put(ctx, :company, company_fixture(%{name: "Test Org"}))
    ctx = Map.put(ctx, :champion, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Dorcy Devonshire"}))
    ctx = Map.put(ctx, :reviewer, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "John Reviewer"}))
    ctx = Map.put(ctx, :group, group_fixture(ctx.champion, %{company_id: ctx.company.id, name: "Designers"}))

    Operately.Groups.add_members(ctx.reviewer, ctx.group.id, [
      %{id: ctx.reviewer.id, access_level: Binding.edit_access()},
      %{id: ctx.champion.id, access_level: Binding.view_access()}
    ])

    {:ok, ctx}
  end

  feature "unread notifications count", ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> Steps.assert_notification_count(1)
    |> Steps.visit_notifications_page()
    |> Steps.click_on_notification("notification-item-space_members_added")
    |> Steps.assert_no_unread_notifications()
    |> UI.logout() # Reset session
  end

  feature "mark all unread notifications as read", ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> Steps.given_a_project_creation_notification_exists()
    |> UI.logout() # Logout before the next login
    |> UI.login_as(ctx.champion)
    |> Steps.assert_notification_count(2)
    |> Steps.visit_notifications_page()
    |> Steps.click_on_first_mark_all_as_read()
    |> Steps.assert_no_unread_notifications()
    |> UI.logout() # Reset session
  end

end
