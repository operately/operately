defmodule Operately.Support.Features.GoalSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps

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

  def submit_check_in(ctx, message, target_values: target_values) do
    ctx
    |> visit_page()
    |> UI.click(testid: "check-in-now")
    |> UI.fill_rich_text(message)
    |> UI.fill(testid: "target-first-response-time", with: to_string(Enum.at(target_values, 0)))
    |> UI.fill(testid: "target-increase-feedback-score-to-90-", with: to_string(Enum.at(target_values, 1)))
    |> UI.click(testid: "submit-check-in")
  end

  def assert_check_in(ctx, message, target_values) do
    ctx
    |> UI.assert_text("Check-In from")
    |> UI.assert_text(message)
    |> UI.assert_text("First response time value changed from 10 to #{Enum.at(target_values, 0)} minutes")
    |> UI.assert_text("Increase feedback score to 90% value changed from 80 to #{Enum.at(target_values, 1)}%")
  end

  def assert_check_in_visible_in_goal_feed(ctx) do
    ctx
    |> visit_page()
    |> FeedSteps.assert_goal_check_in(author: ctx.champion)
  end

  def assert_check_in_email_sent_to_reviewer(ctx) do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.reviewer, 
      author: ctx.champion, 
      action: "submitted a check-in"
    })
  end

  def visit_page(ctx) do
    UI.visit(ctx, "/goals/#{ctx.goal.id}")
  end

  def visit_goal_list_page(ctx) do
    UI.visit(ctx, "/spaces/#{ctx.group.id}/goals")
  end
end
