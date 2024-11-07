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
    setup :register_and_log_in_account

    test "get_spaces", ctx do
      s1 = group_fixture(ctx.person, company_id: ctx.company.id, name: "Space 1")
      s2 = group_fixture(ctx.person, company_id: ctx.company.id, name: "Space 2")

      assert {200, res} = query(ctx.conn, :get_spaces, %{})

      company_space = Operately.Groups.get_group!(ctx.company.company_space_id)

      [s1, s2, company_space]
      |> Enum.map(fn s -> Operately.Repo.preload(s, :company) end)
      |> Enum.sort_by(& &1.name)
      |> Enum.with_index()
      |> Enum.each(fn {space, i} ->
        space = Operately.Repo.preload(space, :members)
        assert Enum.at(res.spaces, i) == Serializer.serialize(space, level: :full)
      end)
    end
  end

  #
  # Helpers
  #

  defp assert_spaces(res, spaces, count) do
    assert length(res.spaces) == count
    Enum.each(spaces, fn s ->
      s = Repo.preload(s, :members)
      assert Enum.find(res.spaces, &(&1 == Serializer.serialize(s, level: :full)))
    end)
  end

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.view_access(),
    }])
  end
end
