defmodule Operately.Features.NotificationsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access.Binding
  alias Operately.Support.Features.NotificationsSteps

  setup ctx do
    ctx = Map.put(ctx, :company, company_fixture(%{name: "Test Org"}))
    ctx = Map.put(ctx, :champion, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Dorcy Devonshire"}))
    ctx = Map.put(ctx, :reviewer, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "John Reviewer"}))
    ctx = Map.put(ctx, :group, group_fixture(ctx.champion, %{company_id: ctx.company.id, name: "Designers"}))

    Operately.Groups.add_members(ctx.reviewer, ctx.group.id, [
      %{
        id: ctx.reviewer.id,
        permissions: Binding.view_access(),
      },
      %{
        id: ctx.champion.id,
        permissions: Binding.view_access(),
      }
    ])

    {:ok, ctx}
  end

  feature "unread notifications count", ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_notification_count(1)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.click_on_notification("notification-item-space_members_added")
    |> NotificationsSteps.assert_no_unread_notifications()
  end

  feature "mark all unread notifications as read", ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> given_a_project_creation_notification_exists()
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_notification_count(2)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.click_on_first_mark_all_as_read()
    |> NotificationsSteps.assert_no_unread_notifications()
  end

  step :given_a_project_creation_notification_exists, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.click(testid: "projects-tab")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person_in(id: "Champion", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "Reviewer", name: ctx.reviewer.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")
  end
end
