defmodule OperatelyWeb.Api.Queries.GetGroupTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_space, %{id: "1"})
    end
  end

  describe "get_space functionality" do
    setup :register_and_log_in_account

    test "space does not exist", ctx do
      assert {404, _} = query(ctx.conn, :get_space, %{id: Ecto.UUID.generate()})
    end

    test "get_space", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id)

      assert {200, res} = query(ctx.conn, :get_space, %{id: space.id})
      assert res.space == %{
        id: space.id,
        name: space.name,
        mission: space.mission,
        icon: space.icon,
        color: space.color,
        is_company_space: ctx.company.company_space_id == space.id,
        is_member: true,
        members: nil
      }
    end

    test "get_space when not a member", ctx do
      creator = person_fixture(company_id: ctx.company.id)
      space = group_fixture(creator, company_id: ctx.company.id)

      assert {200, res} = query(ctx.conn, :get_space, %{id: space.id})
      assert res.space == %{
        id: space.id,
        name: space.name,
        mission: space.mission,
        icon: space.icon,
        color: space.color,
        is_company_space: ctx.company.company_space_id == space.id,
        is_member: false,
        members: nil
      }
    end

    test "include_members", ctx do
      space = group_fixture(ctx.person, company_id: ctx.company.id)

      m1 = person_fixture(company_id: ctx.company.id, full_name: "Alice Smith")
      m2 = person_fixture(company_id: ctx.company.id, full_name: "Bob Smith")
      m3 = person_fixture(company_id: ctx.company.id, full_name: "Charlie Smith")

      [m1, m2, m3] |> Enum.each(fn m -> Operately.Groups.add_member(space, m.id) end)

      assert {200, res} = query(ctx.conn, :get_space, %{id: space.id, include_members: true})
      assert length(res.space.members) == 4 # 3 members + current user

      [m1, m2, m3, ctx.person] 
      |> Enum.sort_by(fn m -> m.full_name end)
      |> Enum.with_index()
      |> Enum.map(fn {m, i} -> {m, Enum.at(res.space.members, i)} end)
      |> Enum.each(fn {m, res} ->
        assert res == %{id: m.id, full_name: m.full_name, avatar_url: m.avatar_url, title: m.title}
      end)
    end
  end
end 
