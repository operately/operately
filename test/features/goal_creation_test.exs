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
    |> UI.click(testid: "add-goal")
    |> UI.fill(testid: "name-input", with: goal_name)
    |> UI.select_person_in(id: "champion-search", name: ctx.champion.full_name)
    |> UI.select_person_in(id: "reviewer-search", name: ctx.reviewer.full_name)
    |> UI.click(testid: "save")

    ctx
    |> UI.assert_text("Improve support first response time")
    |> FeedSteps.assert_goal_added(author: ctx.champion)

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_goal_created_sent(author: ctx.champion, role: "reviewer")
    |> EmailSteps.assert_goal_created_sent(author: ctx.champion, goal: goal_name, role: "reviewer", to: ctx.reviewer)
  end
end
