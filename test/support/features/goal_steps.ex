defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  def create_goal(ctx) do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

    {:ok, goal} = Operately.Goals.create_goal(champion, %{
      company_id: company.id,
      space_id: group.id,
      name: "Improve support first response time",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: "2023-Q4",
      targets: [
        %{
          name: "First response time",
          from: 30,
          to: 15,
          unit: "minutes",
          index: 0
        },
        %{
          name: "Increase feedback score to 90%",
          from: 80,
          to: 90,
          unit: "percent",
          index: 1
        }
      ]
    })

    Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group, goal: goal})
  end

  def visit_page(ctx) do
    UI.visit(ctx, "/goals/#{ctx.goal.id}")
  end

  def visit_goal_list_page(ctx) do
    UI.visit(ctx, "/spaces/#{ctx.group.id}/goals")
  end
end
