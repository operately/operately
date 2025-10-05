defmodule Operately.EE.Features.SupportSessionTest do
  use Operately.FeatureCase

  alias Operately.Support.Factory

  @cookie_name "support_session_token"

  setup ctx do
    Factory.setup(ctx)
  end

  feature "support session", ctx do
    ctx
    |> given_that_a_site_admin_is_logged_in()
    |> visit_the_company_page_in_admin()
    |> start_support_session()
    |> assert_the_company_home_page_is_opened()
    |> assert_cookie_is_set()
    |> assert_support_banner_is_displayed()
    |> exit_support_session()
    |> assert_redirected_to_admin()
    |> assert_cookie_is_deleted()
  end

  #
  # steps
  #

  defp given_that_a_site_admin_is_logged_in(ctx) do
    ctx
    |> Factory.add_account(:admin)
    |> promote_to_site_admin(:admin)
    |> login_as_site_admin(:admin)
  end

  defp visit_the_company_page_in_admin(ctx) do
    ctx
    |> UI.visit("/admin/companies/#{OperatelyWeb.Paths.company_id(ctx.company)}")
    |> UI.assert_text(ctx.company.name)
  end

  defp start_support_session(ctx) do
    ctx
    |> UI.click(testid: "start-support-session")
    |> UI.sleep(500)  # wait for page reload
  end

  defp assert_the_company_home_page_is_opened(ctx) do
    ctx
    |> UI.assert_text(ctx.company.name)
    |> UI.assert_has(testid: "company-home")
  end

  defp promote_to_site_admin(ctx, account_name) do
    account = Map.fetch!(ctx, account_name)
    {:ok, admin} = Operately.People.Account.promote_to_admin(account)
    Map.put(ctx, account_name, admin)
  end

  defp login_as_site_admin(ctx, account_name) do
    account = Map.fetch!(ctx, account_name)
    id = URI.encode_query(%{id: account.id})

    UI.visit(ctx, "/accounts/auth/test_login?" <> id)
  end

  defp assert_support_banner_is_displayed(ctx) do
    ctx |> UI.assert_text("Support Mode Active")
  end

  defp exit_support_session(ctx) do
    ctx
    |> UI.click(testid: "end-support-session-button")
    |> UI.sleep(500)  # wait for page reload
  end

  defp assert_redirected_to_admin(ctx) do
    ctx |> UI.assert_text("Saas Admin Panel")
  end

  defp assert_cookie_is_set(ctx) do
    cookies = ctx |> UI.get_all_cookies()

    assert Enum.any?(cookies, fn c -> c["name"] == @cookie_name end), "Expected support_session_token cookie to be set"

    ctx
  end

  defp assert_cookie_is_deleted(ctx) do
    cookies = ctx |> UI.get_all_cookies()

    assert Enum.all?(cookies, fn c -> c["name"] != @cookie_name end), "Expected support_session_token cookie to be deleted"

    ctx
  end

end
