defmodule Operately.Features.CompanyAdmin.CompanySettingsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.CompanyAdminSteps, as: Steps

  setup ctx, do: Steps.setup(ctx, as: ctx[:role])

  set_app_config(:billing_enabled, true)

  @tag role: :admin
  feature "rename company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.open_company_admins_page()
    |> Steps.click_rename_company()
    |> Steps.fill_in_new_company_name_and_submit()
    |> Steps.assert_company_name_is_changed()
    |> Steps.assert_company_name_is_changed_in_navbar()
    |> Steps.assert_company_feed_shows_the_company_name_change()
  end

  @tag role: :member
  feature "member can't rename company", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_edit_access_level()
    |> Steps.visit_company_admin_page()
    |> Steps.assert_rename_company_not_visible()
  end

  @tag role: :owner
  feature "Delete company", ctx do
    ctx
    |> Steps.add_second_company_with_resources()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.click_delete_company()
    |> Steps.confirm_delete_company()
    |> Steps.assert_redirected_to_lobby()
    |> Steps.assert_company_is_deleted()
    |> Steps.assert_other_company_is_intact()
  end

  @tag role: :admin
  feature "Admin cannot see delete company option", ctx do
    ctx
    |> Steps.assert_logged_in_user_has_admin_access_level()
    |> Steps.when_i_open_the_company_admin_page()
    |> Steps.assert_delete_company_not_visible()
  end
end
