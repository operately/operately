defmodule Operately.Features.CompanyAdmin.AccessAndValidationTest do
  use Operately.FeatureCase
  use Operately.Support.Features.CompanyAdminCase

  set_app_config(:billing_enabled, true)

  @tag role: :member
  feature "member gets 404 when manually navigates to manage-people page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_manage_people_page()
    |> Steps.assert_404()
  end

  @tag role: :member
  feature "member gets 404 when manually navigates to member type selection page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_member_type_selection_page()
    |> Steps.assert_404()
  end

  @tag role: :member
  feature "member gets 404 when manually navigates to invite person page", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_invite_person_page()
    |> Steps.assert_404()
  end

  describe "form validation" do
    @tag role: :admin
    feature "missing full name", ctx do
      params = %{
        full_name: "",
        email: "m.scott@dmif.com",
        title: "Regional Manager"
      }

      error = "Name is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "missing email", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "",
        title: "Regional Manager"
      }

      error = "Email is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "missing title", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "m.scott@dmif.com",
        title: ""
      }

      error = "Title is required"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end

    @tag role: :admin
    feature "invalid email", ctx do
      params = %{
        full_name: "Michael Scott",
        email: "m.scott",
        title: "Regional Manager"
      }

      error = "Enter a valid email address"

      ctx
      |> Steps.assert_logged_in_user_has_admin_access_level()
      |> Steps.open_company_team_page()
      |> Steps.assert_error_message_not_visible(error)
      |> Steps.invite_company_member(params)
      |> Steps.assert_error_message(error)
    end
  end
end
