defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.FeedSteps

  setup ctx do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})

    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

    ctx = Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group})
    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "add goal", ctx do
    goal_name = "Improve support first response time"

    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "goals-tab")
    |> UI.click(testid: "add-goal")
    |> UI.fill(testid: "goal-name", with: goal_name)
    |> UI.select_person_in(id: "champion-search", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "reviewer-search", name: ctx.reviewer.full_name)
    |> UI.fill(testid: "target-0-name", with: "First response time")
    |> UI.fill(testid: "target-0-current", with: "30")
    |> UI.fill(testid: "target-0-target", with: "15")
    |> UI.fill(testid: "target-0-unit", with: "minutes")
    |> UI.fill(testid: "target-1-name", with: "Increase feedback score to 90%")
    |> UI.fill(testid: "target-1-current", with: "80")
    |> UI.fill(testid: "target-1-target", with: "90")
    |> UI.fill(testid: "target-1-unit", with: "percent")
    |> UI.click(testid: "add-goal-button")

    ctx
    |> UI.assert_text("Improve support first response time")
    |> UI.assert_text("First response time")
    |> UI.assert_text("Increase feedback score to 90%")
    |> FeedSteps.assert_goal_added(author: ctx.champion)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      to: ctx.reviewer,
      author: ctx.champion,
      action: "added the #{goal_name} goal"
    })

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_goal_created_sent(author: ctx.champion, role: "reviewer")
  end
  
end
