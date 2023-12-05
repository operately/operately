defmodule Operately.Features.ProjectCreationTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

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
    ctx
    |> UI.visit("/spaces/#{ctx.group.id}")
    |> UI.click(testid: "add-goal")
    |> UI.fill(testid: "goal-name-input", with: "Improve support first response time")
    |> UI.select_person(ctx.champion.full_name)
    |> UI.click(testid: "save")
    |> UI.assert_text("Improve support first response time")
  end
end
