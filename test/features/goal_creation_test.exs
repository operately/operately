defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})

    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

    ctx = Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group})
    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @parent_goal_params %{
    name: "Improve support first response time",
    target_name: "First response time",
    from: "30",
    to: "15",
    unit: "minutes",
  }

  @goal_params %{
    name: "Reduce first response time for support tickets",
    target_name: "First response time",
    from: "30",
    to: "15",
    unit: "minutes",
  }

  @tag login_as: :champion
  feature "add a company wide goal", ctx do
    ctx
    |> Steps.visit_company_goals_page()
    |> Steps.add_company_goal(@goal_params)
    |> Steps.assert_company_goal_added(@goal_params)
    |> Steps.assert_company_goal_created_email_sent(@goal_params.name)
  end


  @tag login_as: :champion
  feature "add subgoal to a company wide goal", ctx do
    ctx
    |> Steps.given_a_goal_exists(@parent_goal_params)
    |> Steps.visit_company_goals_page()
    |> Steps.add_subgoal(%{parent_name: @parent_goal_params.name, goal_params: @goal_params})
    |> Steps.assert_subgoal_added(%{parent_name: @parent_goal_params.name, goal_params: @goal_params})
    |> Steps.assert_subgoal_created_email_sent(@goal_params.name)
  end
  
end
