defmodule OperatelyWeb.Api.Plugs.RequireCompanyContextTest do
  use ExUnit.Case, async: true

  import Plug.Conn
  import Plug.Test

  alias OperatelyWeb.Api.Plugs.RequireCompanyContext

  setup do
    conn =
      conn(:get, "/api/v2/comments/list")
      |> assign(:turbo_req_type, :query)
      |> assign(:turbo_req_name, "comments/list")

    {:ok, conn: conn}
  end

  test "missing company context returns a structured bad request", %{conn: conn} do
    conn = RequireCompanyContext.call(conn, [])

    assert conn.status == 400
    assert conn.halted
    assert get_resp_header(conn, "content-type") == ["application/json; charset=utf-8"]
    assert %{"code" => "missing_company_context"} = Jason.decode!(conn.resp_body)
  end

  test "a company without a person returns not found", %{conn: conn} do
    conn = conn |> assign(:current_company, %Operately.Companies.Company{}) |> RequireCompanyContext.call([])

    assert conn.status == 404
    assert conn.halted
  end

  test "valid company and person context passes through", %{conn: conn} do
    conn = conn |> assign(:current_company, %Operately.Companies.Company{}) |> assign(:current_person, %Operately.People.Person{})

    assert RequireCompanyContext.call(conn, []) == conn
  end

  test "explicitly exempt endpoints do not require company context", %{conn: conn} do
    assert RequireCompanyContext.call(conn, except: [{:query, "comments/list"}]) == conn
  end

  test "exemptions match both the endpoint and request type", %{conn: conn} do
    conn = RequireCompanyContext.call(conn, except: [{:mutation, "comments/list"}])

    assert conn.status == 400
    assert conn.halted
  end

  test "error messages use the active locale", %{conn: conn} do
    conn = Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn -> RequireCompanyContext.call(conn, []) end)
    message = Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn -> Gettext.dgettext(OperatelyWeb.Gettext, "messages", "The request was malformed") end)

    assert Jason.decode!(conn.resp_body)["message"] == message
    refute message == "The request was malformed"
  end
end
