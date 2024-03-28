defmodule Operately.Features.GoalCreationTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps
  import Operately.PeopleFixtures

  setup ctx do
    ctx = Steps.create_goal(ctx)
    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "archive goal", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.archive_goal()
    |> Steps.assert_goal_archived()
    |> Steps.assert_goal_archived_email_sent()
    |> Steps.assert_goal_archived_feed_posted()
  end

  @tag login_as: :champion
  feature "editing goals", ctx do
    values = %{
      name: "New Goal Name", 
      champion: person_fixture_with_account(%{company_id: ctx.company.id, full_name: "John New Champion"}),
      reviewer: person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Leonardo New Reviewer"}),
      new_targets: [%{name: "Sold 1000 units", current: 0, target: 1000, unit: "units"}]
    }

    ctx
    |> Steps.visit_page()
    |> Steps.edit_goal(values)
    |> Steps.assert_goal_edited(values)
    |> Steps.assert_goal_edited_email_sent(values)
    |> Steps.assert_goal_edited_feed_posted()
  end

  @tag login_as: :champion
  feature "changing goal parent", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.assert_goal_is_company_wide()
    |> Steps.change_goal_parent()
    |> Steps.assert_goal_parent_changed()
  end
  
end
