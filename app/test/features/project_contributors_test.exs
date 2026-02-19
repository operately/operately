defmodule Operately.Features.ProjectsContributorsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Test Project")
    |> Steps.setup_contributors()
    |> Steps.login()
  end

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

  @tag login_as: :champion
  feature "choosing a new champion for the project", ctx do
    ctx
    |> Steps.visit_project_contributors_page()
    |> Steps.choose_new_champion(name: "Michael Scottish")
    |> Steps.assert_new_champion_is(name: "Michael Scottish")
    |> Steps.assert_old_champion_is_contributor()
    |> Steps.assert_new_champion_chosen_feed_item_exists(name: "Michael")
  end

  @tag login_as: :champion
  feature "choosing a new reviewer for the project", ctx do
    ctx
    |> Steps.visit_project_contributors_page()
    |> Steps.choose_new_reviewer(name: "Michael Scottish")
    |> Steps.assert_new_reviewer_is(name: "Michael Scottish")
    |> Steps.assert_old_reviewer_is_contributor()
    |> Steps.assert_new_reviewer_chosen_feed_item_exists(name: "Michael")
  end

  @tag login_as: :champion
  feature "promote a contributor to a champion", ctx do
    ctx
    |> Steps.given_a_contributor_exists(name: "Debbie Downer")
    |> Steps.visit_project_contributors_page()
    |> Steps.promote_contributor_to_champion(name: "Debbie Downer")
    |> Steps.assert_new_champion_is(name: "Debbie Downer")
    |> Steps.assert_new_champion_chosen_feed_item_exists(name: "Debbie")
  end

  @tag login_as: :champion
  feature "promote a contributor to a reviewer", ctx do
    ctx
    |> Steps.given_a_contributor_exists(name: "Debbie Downer")
    |> Steps.visit_project_contributors_page()
    |> Steps.promote_contributor_to_reviewer(name: "Debbie Downer")
    |> Steps.assert_new_reviewer_is(name: "Debbie Downer")
    |> Steps.assert_new_reviewer_chosen_feed_item_exists(name: "Debbie")
  end
end
