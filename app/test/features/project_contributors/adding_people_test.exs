defmodule Operately.Features.ProjectContributors.AddingPeopleTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "adding project contributors" do
    setup ctx, do: Steps.setup_default_people(ctx)

    @tag login_as: :champion
    feature "functionality", ctx do
      contrib = %{name: "Michael Scott", responsibility: "Lead the backend implementation"}

      ctx
      |> Steps.visit_project_page()
      |> Steps.add_contributor(contrib)
      |> Steps.assert_contributor_added(contrib)
      |> Steps.assert_contributor_added_feed_item_exists(name: contrib.name)
      |> Steps.assert_contributor_added_notification_sent(name: contrib.name)
      |> Steps.assert_contributor_added_email_sent(name: contrib.name)
    end

    @tag login_as: :champion
    feature "full access", ctx do
      contrib = %{name: "Michael Scott", access: "Full Access", responsibility: "Lead the backend implementation"}

      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.add_contributor(contrib)
      |> Steps.assert_contributor_added(contrib)
      |> Steps.assert_access_level_of_added_contributor(contrib)
    end

    @tag login_as: :contributor
    feature "edit access", ctx do
      contrib = %{name: "Michael Scott", access: "Comment Access", responsibility: "Lead the design implementation"}

      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.add_contributor(contrib)
      |> Steps.assert_contributor_added(contrib)
      |> Steps.assert_access_level_of_added_contributor(contrib)
    end

    @tag login_as: :contributor
    feature "contributor with edit access doesn't see full-access option", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.start_adding_contributor()
      |> Steps.assert_full_access_option_not_available()
    end
  end
end
