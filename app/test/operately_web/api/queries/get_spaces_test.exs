defmodule OperatelyWeb.Api.Queries.GetSpacesTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_space, %{id: "1"})
    end

    test "it returns only spaces from the user's company", ctx do
      ctx = register_and_log_in_account(ctx)

      company = ctx.company
      space = group_fixture(ctx.person, company_id: company.id)

      other_company = company_fixture()
      other_space = group_fixture(person_fixture(company_id: other_company.id), company_id: other_company.id)

      assert {200, res} = query(ctx.conn, :get_spaces, %{})
      assert Enum.find(res.spaces, fn s -> s.id == Paths.space_id(space) end) != nil
      assert Enum.find(res.spaces, fn s -> s.id == Paths.space_id(other_space) end) == nil
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "members have access to company space only", ctx do
      Enum.each(1..3, fn _ ->
        group_fixture(ctx.creator, company_id: ctx.company.id)
      end)
      spaces = Groups.list_groups_for_company(ctx.company.id)

      company_space = Groups.get_group!(ctx.company.company_space_id) |> Repo.preload(:company)

      assert {200, res} = query(ctx.conn, :get_spaces, %{})
      assert length(spaces) == 4
      assert_spaces(res, [company_space], 1)
    end

    test "members have access to spaces they are part of", ctx do
      spaces = Enum.map(1..3, fn _ ->
        space = group_fixture(ctx.creator, company_id: ctx.company.id)
        add_person_to_space(ctx, space)
        Repo.preload(space, :company)
      end)
      Enum.each(1..3, fn _ ->
        group_fixture(ctx.creator, company_id: ctx.company.id)
      end)

      assert {200, res} = query(ctx.conn, :get_spaces, %{})
      assert_spaces(res, spaces, 4)
    end

    test "members have access to spaces they are NOT part of", ctx do
      Enum.each(1..2, fn _ ->
        group_fixture(ctx.creator, company_id: ctx.company.id)
      end)
      spaces = Enum.map(1..2, fn _ ->
        space = group_fixture(ctx.creator, [
          company_id: ctx.company.id,
          company_permissions: Binding.view_access(),
        ])
        Repo.preload(space, :company)
      end)

      assert {200, res} = query(ctx.conn, :get_spaces, %{})
      assert_spaces(res, spaces, 3)
    end
  end

  describe "get_spaces functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
    end

    test "get_spaces", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space1, name: "Space 1")
        |> Factory.add_space(:space2, name: "Space 2")

      assert {200, res} = query(ctx.conn, :get_spaces, %{})

      company_space = Operately.Groups.get_group!(ctx.company.company_space_id)

      [ctx.space1, ctx.space2, company_space]
      |> Enum.map(fn s -> Operately.Repo.preload(s, :company) end)
      |> Enum.sort_by(& &1.name)
      |> Enum.with_index()
      |> Enum.each(fn {space, i} ->
        assert Enum.at(res.spaces, i).id == Paths.space_id(space)
      end)
    end

    test "includes guests and excludes ai members", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:human, :space, person_type: :human)
        |> Factory.add_space_member(:guest, :space, person_type: :guest)
        |> Factory.add_space_member(:ai, :space, person_type: :ai)

      assert {200, res} = query(ctx.conn, :get_spaces, %{include_members: true})

      assert space_res = Enum.find(res.spaces, &(&1.id == Paths.space_id(ctx.space)))
      assert length(space_res.members) == 3 # 1 creator (ctx.person) + 1 added human + 1 guest
      assert Enum.find(space_res.members, &(&1.id == Paths.person_id(ctx.human)))
      assert Enum.find(space_res.members, &(&1.id == Paths.person_id(ctx.guest)))
      refute Enum.find(space_res.members, &(&1.id == Paths.person_id(ctx.ai)))
    end
  end

  #
  # Helpers
  #

  defp assert_spaces(res, spaces, count) do
    assert length(res.spaces) == count
    Enum.each(spaces, fn s ->
      assert Enum.find(res.spaces, fn r -> r.id == Paths.space_id(s) end) != nil
    end)
  end

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.view_access(),
    }])
  end
end
