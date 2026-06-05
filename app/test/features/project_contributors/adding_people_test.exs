defmodule Operately.Features.ProjectContributors.AddingPeopleTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ProjectContributorsCase

  describe "adding project contributors" do
    setup ctx do
      ctx
      |> Steps.given_a_person_exists(name: "Michael Scott")
      |> Steps.given_a_person_exists(name: "Dwight Schrute")
      |> Steps.given_a_person_exists(name: "Jim Halpert")
    end

    @tag login_as: :champion
    feature "functionality", ctx do
      contribs = [
        %{name: "Michael Scott", responsibility: "Lead the backend implementation"},
        %{name: "Dwight Schrute", responsibility: "Lead the frontend implementation"},
        %{name: "Jim Halpert", responsibility: "Lead the design implementation"}
      ]

      ctx
      |> Steps.visit_project_page()
      |> Steps.add_contributors(contribs)
      |> Steps.assert_contributors_added(contribs)
      |> Steps.assert_contributors_added_feed_item_exists(contribs)
      |> Steps.assert_contributors_added_notification_sent(contribs)
      |> Steps.assert_contributors_added_email_sent(contribs)
    end

    @tag login_as: :champion
    feature "full access", ctx do
      contribs = [
        %{name: "Michael Scott", access: "Edit Access", responsibility: "Lead the backend implementation"},
        %{name: "Dwight Schrute", access: "Full Access", responsibility: "Lead the frontend implementation"},
        %{name: "Jim Halpert", access: "Comment Access", responsibility: "Lead the design implementation"}
      ]

      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.add_contributors(contribs)
      |> Steps.assert_contributors_added(contribs)
      |> Steps.assert_access_level_of_added_contributors(contribs)
    end

    @tag login_as: :contributor
    feature "edit access", ctx do
      contribs = [
        %{name: "Michael Scott", access: "Edit Access", responsibility: "Lead the backend implementation"},
        %{name: "Dwight Schrute", access: "View Access", responsibility: "Lead the frontend implementation"},
        %{name: "Jim Halpert", access: "Comment Access", responsibility: "Lead the design implementation"}
      ]

      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.add_contributors(contribs)
      |> Steps.assert_contributors_added(contribs)
      |> Steps.assert_access_level_of_added_contributors(contribs)
    end

    @tag login_as: :contributor
    feature "contributor with edit access doesn't see full-access option", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_edit_access()
      |> Steps.visit_project_page()
      |> Steps.start_adding_contributors()
      |> Steps.assert_full_access_option_not_available()
    end

    @tag login_as: :commenter
    feature "contributor with comment access gets 404", ctx do
      ctx
      |> Steps.assert_logged_in_contributor_has_comment_access()
      |> Steps.visit_project_contributors_page(:direct)
      |> Steps.assert_404()
    end
  end
end
