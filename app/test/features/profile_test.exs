defmodule Operately.Features.ProfileTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProfileSteps, as: Steps

  setup ctx do
    ctx = Steps.given_a_person_exists_with_manager_reports_and_peers(ctx)
    Operately.Support.Features.UI.login_as(ctx, ctx.person)
  end

  feature "view how to contact the person", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_about_tab()
    |> Steps.assert_contact_email_visible()
  end

  feature "view colleagues", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_about_tab()
    |> Steps.assert_manager_visible()
    |> Steps.assert_reports_visible()
    |> Steps.assert_peers_visible()
  end

  feature "view manager's profile", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_about_tab()
    |> Steps.click_manager()
    |> Steps.assert_on_manager_profile()
    |> Steps.assert_person_listed_as_report_on_manager_profile()
  end

  feature "view assigned goals and projects", ctx do
    ctx
    |> Steps.given_goals_exist_for_person()
    |> Steps.given_projects_exist_for_person()
    |> Steps.visit_profile_page()
    |> Steps.assert_assinged_goals_and_projects_visible()
    |> Steps.refute_reviewing_goals_and_projects_visible()
  end

  feature "view reviewing goals and projects", ctx do
    ctx
    |> Steps.given_goals_exist_for_person()
    |> Steps.given_projects_exist_for_person()
    |> Steps.visit_profile_page()
    |> Steps.click_reviewing_tab()
    |> Steps.assert_reviewing_goals_and_projects_visible()
    |> Steps.refute_assinged_goals_and_projects_visible()
  end

end
