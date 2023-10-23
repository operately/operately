defmodule Operately.Features.ProjectCreationTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  setup ctx do
    company = company_fixture(%{name: "Test Org"})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})

    ctx = Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer})
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "add project", ctx do
    ctx
    |> UI.visit("/projects")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(ctx.champion.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")
  end

  @tag login_as: :reviewer
  feature "add project and assign someone else as champion", ctx do
    ctx
    |> UI.visit("/projects")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(ctx.champion.full_name)
    |> UI.select(testid: "your-role-input", option: "Reviewer")
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_project_created_notification_sent(author: ctx.reviewer, role: "champion")
    |> EmailSteps.assert_project_created_email_sent(author: ctx.reviewer, project: "Website Redesign", to: ctx.champion, role: "Champion")
  end

  @tag login_as: :champion
  feature "add a private project", ctx do
    ctx
    |> UI.visit("/projects")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(ctx.champion.full_name)
    |> UI.click(testid: "invite-only")
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")
    |> UI.assert_has(testid: "private-project-indicator")
  end
end
