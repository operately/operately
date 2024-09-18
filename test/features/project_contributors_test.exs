defmodule Operately.Features.ProjectsContributorsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

  setup ctx do
    ctx = Steps.create_project(ctx, name: "Test Project")
    ctx = Steps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "adding a project contributor", ctx do
    ctx
    |> Steps.given_a_person_exists(name: "Michael Scott")
    |> Steps.visit_project_page()
    |> Steps.add_contributor(name: "Michael Scott", responsibility: "Lead the backend implementation")
    |> Steps.assert_contributor_added(name: "Michael Scott", responsibility: "Lead the backend implementation")
    |> Steps.assert_contributor_added_feed_item_exists(name: "Michael Scott")
    |> Steps.assert_contributor_added_notification_sent(name: "Michael Scott")
    |> Steps.assert_contributor_added_email_sent(name: "Michael Scott")
  end

  @tag login_as: :champion
  feature "removing a project contributor", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.given_the_project_has_contributor(name: "Michael Scott")
    |> Steps.remove_contributor(name: "Michael Scott")
    |> Steps.assert_contributor_removed(name: "Michael Scott")
    |> Steps.assert_contributor_removed_feed_item_exists(name: "Michael Scott")
  end

  @tag login_as: :champion
  feature "removing a project reviewer", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.remove_contributor(name: ctx.reviewer.full_name)
    |> Steps.assert_reviewer_removed()
    |> Steps.assert_contributor_removed_feed_item_exists(name: ctx.reviewer.full_name)
  end

  @tag login_as: :champion
  feature "converting a project reviewer to a contributor", ctx do
    params = %{name: ctx.reviewer.full_name, responsibility: "Lead the backend implementation"}

    ctx
    |> Steps.visit_project_page()
    |> Steps.convert_reviewer_to_contributor(params)
    |> Steps.assert_reviewer_converted_to_contributor(params)
    |> Steps.assert_reviewer_converted_to_contributor_feed_item_exists()
  end

  @tag login_as: :champion
  feature "converting a project champion to a contributor", ctx do
    params = %{name: ctx.champion.full_name, responsibility: "Design the user interface"}

    ctx
    |> Steps.visit_project_page()
    |> Steps.convert_champion_to_contributor(params)
    |> Steps.assert_champion_converted_to_contributor(params)
    |> Steps.assert_champion_converted_to_contributor_feed_item_exists()
  end

  @tag login_as: :champion
  feature "listing all other people who can access the project", ctx do
    ctx
    |> Steps.given_company_members_have_access()
    |> Steps.visit_project_contributors_page()
    |> Steps.expand_show_other_people()
    |> Steps.assert_other_people_listed()
  end
end
