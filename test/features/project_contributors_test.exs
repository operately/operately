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
end
