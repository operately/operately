defmodule OperatelyWeb.Api.Queries.GetCompanyTest do
  use OperatelyWeb.TurboCase

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

    test "include_members_access_levels", ctx do
      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_people: true,
        include_members_access_levels: true
      })

      member = includes_person(res.company.people, ctx.member_peter)
      admin = includes_person(res.company.people, ctx.admin_susan)
      owner = includes_person(res.company.people, ctx.owner_john)

      assert member.access_level == Operately.Access.Binding.view_access()
      assert admin.access_level == Operately.Access.Binding.admin_access()
      assert owner.access_level == Operately.Access.Binding.full_access()
    end

    defp includes_person(list, person) do
      Enum.find(list, fn p -> p.id == Paths.person_id(person) end)
    end
  end

  describe "guest access (minimal access level)" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)

      ctx
      |> Factory.add_company_member(:member_peter)
      |> Factory.add_company_admin(:admin_susan)
      |> Factory.add_outside_collaborator(:guest_bob, :admin_susan)
    end

    test "guest can fetch company without includes", ctx do
      ctx = log_in_account(ctx, ctx.guest_bob)

      assert {200, res} = query(ctx.conn, :get_company, %{id: Paths.company_id(ctx.company)})
      assert res.company
      refute res.company.people
      refute res.company.admins
      refute res.company.owners
    end

    test "guest can fetch company with include_permissions", ctx do
      ctx = log_in_account(ctx, ctx.guest_bob)

      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_permissions: true
      })

      assert res.company
      assert res.company.permissions
    end

    test "guest cannot see people list", ctx do
      ctx = log_in_account(ctx, ctx.guest_bob)

      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_people: true
      })

      assert res.company
      refute res.company.people
    end

    test "guest cannot see admins list", ctx do
      ctx = log_in_account(ctx, ctx.guest_bob)

      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_admins: true
      })

      assert res.company
      refute res.company.admins
    end

    test "guest cannot see owners list", ctx do
      ctx = log_in_account(ctx, ctx.guest_bob)

      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_owners: true
      })

      assert res.company
      refute res.company.owners
    end

    test "guest cannot see members access levels", ctx do
      ctx = log_in_account(ctx, ctx.guest_bob)

      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_people: true,
        include_members_access_levels: true
      })

      assert res.company
      refute res.company.people
    end

    test "guest requesting multiple includes only gets permissions", ctx do
      ctx = log_in_account(ctx, ctx.guest_bob)

      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_permissions: true,
        include_people: true,
        include_admins: true,
        include_owners: true
      })

      assert res.company
      assert res.company.permissions
      refute res.company.people
      refute res.company.admins
      refute res.company.owners
    end

    test "regular member still gets full access with all includes", ctx do
      ctx = log_in_account(ctx, ctx.member_peter)

      assert {200, res} = query(ctx.conn, :get_company, %{
        id: Paths.company_id(ctx.company),
        include_people: true,
        include_admins: true,
        include_owners: true,
        include_permissions: true
      })

      assert res.company.people
      assert res.company.admins
      assert res.company.owners
      assert res.company.permissions
    end
  end
end
