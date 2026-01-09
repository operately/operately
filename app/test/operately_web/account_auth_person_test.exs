defmodule OperatelyWeb.AccountAuthPersonTest do
  use OperatelyWeb.ConnCase, async: true

  alias OperatelyWeb.AccountAuth
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup %{conn: conn} do
    conn =
      conn
      |> Map.replace!(:secret_key_base, OperatelyWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})

    %{account: account_fixture(), conn: conn}
  end

  test "returns 404 if account is not a member of the company", %{conn: conn, account: account} do
    company = company_fixture() # Create a company where account is NOT a member

    # Encode short_id properly
    encoded_id = Operately.Companies.ShortId.encode!(company.short_id)

    conn =
      conn
      |> init_test_session(%{})
      |> fetch_cookies()
      |> assign(:current_account, account)
      |> put_req_header("x-company-id", encoded_id)
      |> AccountAuth.fetch_current_company([])
      |> AccountAuth.fetch_current_person([])

    assert conn.halted
    assert conn.status == 404
  end

  test "assigns current_person if account is a member of the company", %{conn: conn, account: account} do
    company = company_fixture(%{}, account) # account is member (creator)

    encoded_id = Operately.Companies.ShortId.encode!(company.short_id)

    conn =
      conn
      |> init_test_session(%{})
      |> fetch_cookies()
      |> assign(:current_account, account)
      |> put_req_header("x-company-id", encoded_id)
      |> AccountAuth.fetch_current_company([])
      |> AccountAuth.fetch_current_person([])

    refute conn.halted
    assert conn.assigns.current_person
    assert conn.assigns.current_person.account_id == account.id
  end
end
