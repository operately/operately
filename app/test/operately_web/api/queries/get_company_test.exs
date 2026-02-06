defmodule OperatelyWeb.Api.Queries.GetCompanyTest do
  use OperatelyWeb.TurboCase

  alias Operately.Companies.Company

  test "invalid company id", ctx do
    assert {400, res} = query(ctx.conn, :get_company, %{id: "invalid"})
    assert res.message == "Invalid id format"
  end

  describe "security" do
    test "it requires authentication", ctx do
      {:ok, id} = Operately.Companies.ShortId.generate() |> Operately.Companies.ShortId.encode()

      assert {401, _} = query(ctx.conn, :get_company, %{id: id})
    end

    test "suspended people don't have access", ctx do
      ctx = register_and_log_in_account(ctx)
      company = Serializer.serialize(ctx.company, level: :full)

      assert {200, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company)})
      assert res.company == company

      {:ok, _} = Operately.People.update_person(ctx.person, %{suspended_at: DateTime.utc_now()})

      assert {404, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company)})
      assert res.message == "The requested resource was not found"
    end
  end

  describe "get_company functionality" do
    setup :register_and_log_in_account

    setup ctx do
      ctx
      |> Factory.add_company_member(:member_peter)
      |> Factory.add_company_admin(:admin_susan)
      |> Factory.add_company_owner(:owner_john)
    end

    test "only company", ctx do
      company = Serializer.serialize(ctx.company, level: :full)

      assert {200, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company)})
      assert res.company == company
      refute res.company.admins
      refute res.company.people
      refute res.company.access_level
    end

    test "include_people", ctx do
      assert {200, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company), include_people: true})

      assert includes_person(res.company.people, ctx.owner_john)
      assert includes_person(res.company.people, ctx.admin_susan)
      assert includes_person(res.company.people, ctx.member_peter)
    end

    test "include_admins", ctx do
      assert {200, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company), include_admins: true})

      refute includes_person(res.company.admins, ctx.owner_john)
      assert includes_person(res.company.admins, ctx.admin_susan)
      refute includes_person(res.company.admins, ctx.member_peter)
    end

    test "include_owners", ctx do
      assert {200, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company), include_owners: true})

      assert includes_person(res.company.owners, ctx.owner_john)
      refute includes_person(res.company.owners, ctx.admin_susan)
      refute includes_person(res.company.owners, ctx.member_peter)
    end

    test "include_access_level", ctx do
      ctx = log_in_account(ctx, ctx.member_peter)
      {:ok, company} = Company.get(ctx.member_peter, short_id: ctx.company.short_id)

      assert {200, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company), include_access_level: true})
      assert res.company.access_level == company.request_info.access_level
    end

    defp includes_person(list, person) do
      Enum.find(list, fn p -> p.id == Paths.person_id(person) end)
    end
  end
end
