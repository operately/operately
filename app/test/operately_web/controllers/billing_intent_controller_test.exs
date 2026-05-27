defmodule OperatelyWeb.BillingIntentControllerTest do
  use OperatelyWeb.ConnCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias OperatelyWeb.Paths

  describe "GET /billing/intent" do
    test "unauthenticated user is redirected to login with redirect_to", %{conn: conn} do
      conn = get(conn, "/billing/intent?plan=team&billing_period=monthly")

      assert conn.status == 302

      assert redirected_to(conn) ==
               "/log_in?redirect_to=%2Fbilling%2Fintent%3Fplan%3Dteam%26billing_period%3Dmonthly"
    end

    test "unauthenticated user without plan params is redirected to login", %{conn: conn} do
      conn = get(conn, "/billing/intent")

      assert conn.status == 302
      assert redirected_to(conn) == "/log_in?redirect_to=%2Fbilling%2Fintent"
    end

    test "authenticated user with no companies is redirected to /new", %{conn: conn} do
      account = account_fixture()
      conn = log_in_account(conn, account) |> get("/billing/intent?plan=team")

      assert redirected_to(conn) == "/new?plan=team"
    end

    test "authenticated user with one owned company is redirected to company billing plan selection page", %{conn: conn} do
      account = account_fixture()
      company = company_fixture(%{}, account)

      conn = log_in_account(conn, account) |> get("/billing/intent?plan=team&billing_period=monthly")

      company_id = Paths.company_id(company)
      assert redirected_to(conn) == "/#{company_id}/admin/billing/plans?plan=team&billing_period=monthly"
    end

    test "authenticated user with multiple owned companies is redirected to pick-company", %{conn: conn} do
      account = account_fixture()
      company1 = company_fixture(%{company_name: "Company One"}, account)
      _company2 = company_fixture(%{company_name: "Company Two"}, account)

      conn = log_in_account(conn, account, company1) |> get("/billing/intent?plan=team")

      assert redirected_to(conn) == "/billing/pick-company?plan=team"
    end

    test "authenticated user with companies but no ownership is redirected to /", %{conn: conn} do
      %{conn: conn} = register_and_log_in_account(%{conn: conn})

      conn = get(conn, "/billing/intent?plan=team")

      assert redirected_to(conn) == "/"
    end
  end
end
