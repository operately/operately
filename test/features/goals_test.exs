defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.FeedSteps

  import Operately.PeopleFixtures

  setup ctx do
    ctx = GoalSteps.create_goal(ctx)
    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "archive goal", ctx do
    ctx
    |> GoalSteps.visit_page()
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "archive-goal")
    |> UI.assert_text("Archive this goal?")
    |> UI.click(testid: "confirm-archive-goal")
    |> UI.assert_text("This goal was archived on")

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.group.name,
      to: ctx.reviewer, 
      author: ctx.champion, 
      action: "archived the #{ctx.goal.name} goal"
    })

    ctx
    |> GoalSteps.visit_goal_list_page()
    |> UI.refute_has(Query.text(ctx.goal.name))

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_goal_archived_sent(author: ctx.champion, goal: ctx.goal)
  end

  @tag login_as: :champion
  feature "editing goals", ctx do
    new_champion = person_fixture_with_account(%{company_id: ctx.company.id, full_name: "John New Champion"})
    new_reviewer = person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Leonardo New Reviewer"})

    ctx
    |> GoalSteps.visit_page()
    |> UI.click(testid: "goal-options")
    |> UI.click(testid: "edit-goal")
    |> UI.fill(testid: "goal-name", with: "New Goal Name")
    |> UI.select_person_in(id: "champion-search", name: "John New Champion")
    |> UI.select_person_in(id: "reviewer-search", name: "Leonardo New Reviewer")
    |> UI.click(testid: "save-changes")

    ctx
    |> UI.assert_text("New Goal Name")
    |> UI.assert_text("John New Champion")
    |> UI.assert_text("Leonardo New Reviewer")
    |> FeedSteps.assert_goal_edited(author: ctx.champion)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      to: new_champion,
      author: ctx.champion,
      action: "edited the New Goal Name goal"
    })

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      to: new_reviewer,
      author: ctx.champion,
      action: "edited the New Goal Name goal"
    })
  end
  
end
