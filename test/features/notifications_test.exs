defmodule Operately.Features.NotificationsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.NotificationsSteps
  
  setup ctx do
    ctx = Map.put(ctx, :company, company_fixture(%{name: "Test Org"}))
    ctx = Map.put(ctx, :person, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "John Champion"}))
    ctx = Map.put(ctx, :group, group_fixture(ctx.person, %{company_id: ctx.company.id, name: "Designers"}))
    ctx = Map.put(ctx, :champion, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Dorcy Devonshire"}))

    UI.login_as(ctx, ctx.person)
  end

  feature "unread notifications count", ctx do
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(ctx.champion.full_name)
    |> UI.select(testid: "your-role-input", option: "Reviewer")
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_notification_count(1)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.click_on_first_notification()
    |> NotificationsSteps.assert_no_unread_notifications()
  end

end
