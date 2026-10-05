defmodule OperatelyWeb.Api.Queries.GetLanguageTest do
  use OperatelyWeb.TurboCase

  test "anonymous requests use English", ctx do
    assert {200, %{language: "en"}} = query(ctx.conn, :get_language, %{})
  end

  test "account and company resolution respect membership and flag rollback", ctx do
    ctx = ctx |> Factory.setup() |> Factory.enable_feature("i18n") |> Factory.log_in_person(:creator)
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    conn = Plug.Conn.delete_req_header(ctx.conn, "x-company-id")
    company_id = OperatelyWeb.Paths.company_id(ctx.company)

    assert {200, %{language: "pt-BR"}} = query(conn, :get_language, %{})
    assert {200, %{language: "pt-BR"}} = query(conn, :get_language, %{company_id: company_id})

    other = Operately.CompaniesFixtures.company_fixture()
    Operately.PeopleFixtures.person_fixture(%{company_id: other.id, account_id: person.account_id})
    assert {200, %{language: "en"}} = query(conn, :get_language, %{})
    assert {200, %{language: "pt-BR"}} = query(conn, :get_language, %{company_id: company_id})

    Operately.Companies.disable_experimental_feature(ctx.company, "i18n")
    assert {200, %{language: "en"}} = query(conn, :get_language, %{company_id: company_id})
  end

  test "missing, inaccessible and suspended company contexts use English", ctx do
    ctx = ctx |> Factory.setup() |> Factory.enable_feature("i18n") |> Factory.log_in_person(:creator)
    {:ok, _} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    conn = Plug.Conn.delete_req_header(ctx.conn, "x-company-id")
    other = Operately.CompaniesFixtures.company_fixture()

    for id <- ["invalid", OperatelyWeb.Paths.company_id(other)] do
      assert {200, %{language: "en"}} = query(conn, :get_language, %{company_id: id})
    end

    {:ok, _} = Operately.People.update_person(ctx.creator, %{suspended_at: DateTime.utc_now()})
    assert {200, %{language: "en"}} = query(conn, :get_language, %{company_id: OperatelyWeb.Paths.company_id(ctx.company)})
  end
end
