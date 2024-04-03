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
    |> Steps.assert_contact_email_visible()
  end

  feature "view colleagues", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.assert_manager_visible()
    |> Steps.assert_reports_visible()
    |> Steps.assert_peers_visible()
  end

  feature "view manager's profile", ctx do
    ctx
    |> Steps.visit_profile_page()
    |> Steps.click_manager()
    |> Steps.assert_on_manager_profile()
    |> Steps.assert_person_listed_as_report_on_manager_profile()
  end

  feature "view goals", ctx do
    ctx
    |> Steps.given_goals_exist_for_person()
    |> Steps.visit_profile_page()
    |> Steps.click_goals_tab()
    |> Steps.assert_goals_visible()
  end

end
