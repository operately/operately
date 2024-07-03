defmodule OperatelyWeb.Api.Queries.GetSpacesTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

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

  describe "get_spaces functionality" do
    setup :register_and_log_in_account

    test "get_spaces", ctx do
      s1 = group_fixture(ctx.person, company_id: ctx.company.id)
      s2 = group_fixture(ctx.person, company_id: ctx.company.id)

      assert {200, res} = query(ctx.conn, :get_spaces, %{})

      company_space = Operately.Groups.get_group!(ctx.company.company_space_id)
      
      [s1, s2, company_space] 
      |> Enum.map(fn s -> Operately.Repo.preload(s, :company) end)
      |> Enum.sort_by(& &1.name)
      |> Enum.with_index()
      |> Enum.each(fn {space, i} ->
        assert Enum.at(res.spaces, i) == Serializer.serialize(space, level: :full)
      end)
    end
  end 
end 
