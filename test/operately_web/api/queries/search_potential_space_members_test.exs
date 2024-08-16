defmodule OperatelyWeb.Api.Queries.SearchPotentialSpaceMembersTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias OperatelyWeb.Paths
  alias Operately.People
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :search_potential_space_members, %{})
    end

    test "it doesn't return people from other companies", ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.person, company_id: ctx.company.id)
      p1 = person_fixture_with_account(%{company_id: ctx.company.id})
      p2 = person_fixture_with_account(%{company_id: ctx.company.id})
      p3 = person_fixture_with_account(%{company_id: ctx.company.id})

      other_ctx = register_and_log_in_account(ctx)
      other_space = group_fixture(other_ctx.person, company_id: other_ctx.company.id)
      p4 = person_fixture_with_account(%{company_id: other_ctx.company.id})
      p5 = person_fixture_with_account(%{company_id: other_ctx.company.id})
      p6 = person_fixture_with_account(%{company_id: other_ctx.company.id})

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(space)})
      assert length(res.people) == 4

      [p1, p2, p3, ctx.company_creator]
      |> Enum.each(fn person ->
        assert Enum.find(res.people, &(&1 == Serializer.serialize(person)))
      end)

      assert {200, res} = query(other_ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(other_space)})
      assert length(res.people) == 4

      [p4, p5, p6, other_ctx.company_creator]
      |> Enum.each(fn person ->
        assert Enum.find(res.people, &(&1 == Serializer.serialize(person)))
      end)
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      member = person_fixture(company_id: ctx.company.id)

      Map.merge(ctx, %{member: member})
    end

    test "company member has access", ctx do
      space = group_fixture(ctx.company_creator, [
        company_id: ctx.company.id,
        company_permissions: Binding.view_access(),
      ])

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(space)})

      assert length(res.people) == 2
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.member)))
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person)))
    end

    test "company member has no access", ctx do
      space = group_fixture(ctx.company_creator, [
        company_id: ctx.company.id,
        company_permissions: Binding.no_access(),
      ])

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(space)})
      assert length(res.people) == 0
    end

    test "space member has no access", ctx do
      space = group_fixture(ctx.company_creator, [
        company_id: ctx.company.id,
        company_permissions: Binding.no_access(),
      ])

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(space)})
      assert length(res.people) == 0

      add_person_to_space(ctx.person, space)

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(space)})
      assert length(res.people) == 1
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.member)))
    end

    test "suspended people don't have access", ctx do
      space = group_fixture(ctx.company_creator, [
        company_id: ctx.company.id,
        company_permissions: Binding.view_access(),
      ])

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(space)})
      assert length(res.people) == 2

      People.update_person(ctx.person, %{suspended_at: DateTime.utc_now()})

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(space)})
      assert length(res.people) == 0
    end
  end

  describe "search_potential_space_members functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)

      space = group_fixture(ctx.person, company_id: ctx.company.id)
      add_person_to_space(ctx.company_creator, space)

      person1 = person_fixture(full_name: "John Doe", title: "CEO", company_id: ctx.company.id)
      person2 = person_fixture(full_name: "Mike Smith", title: "CTO", company_id: ctx.company.id)

      Map.merge(ctx, %{space: space, person1: person1, person2: person2})
    end

    test "returns all petential members", ctx do
      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(ctx.space)})

      assert length(res.people) == 2
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person1)))
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person2)))
    end

    test "query members by name", ctx do
      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{
        group_id: Paths.space_id(ctx.space),
        query: "Mike",
      })

      assert length(res.people) == 1
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person2)))
    end

    test "query members by title", ctx do
      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{
        group_id: Paths.space_id(ctx.space),
        query: "CEO",
      })

      assert length(res.people) == 1
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person1)))
    end

    test "exlude_ids excludes members from result", ctx do
      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{
        group_id: Paths.space_id(ctx.space),
        exclude_ids: [ctx.person1.id],
      })
      assert length(res.people) == 1
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person2)))

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{
        group_id: Paths.space_id(ctx.space),
        exclude_ids: [ctx.person2.id],
      })
      assert length(res.people) == 1
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person1)))
    end

    test "existing members excluded from result", ctx do
      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(ctx.space)})
      assert length(res.people) == 2

      add_person_to_space(ctx.person1, ctx.space)

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(ctx.space)})
      assert length(res.people) == 1
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person2)))

      add_person_to_space(ctx.person2, ctx.space)

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(ctx.space)})
      assert length(res.people) == 0
    end

    test "suspended people excluded from result", ctx do
      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(ctx.space)})
      assert length(res.people) == 2

      People.update_person(ctx.person1, %{suspended: true})

      assert {200, res} = query(ctx.conn, :search_potential_space_members, %{group_id: Paths.space_id(ctx.space)})
      assert length(res.people) == 1
      assert Enum.find(res.people, &(&1 == Serializer.serialize(ctx.person2)))
    end
  end

  #
  # Helpers
  #

  defp add_person_to_space(person, space) do
    Operately.Groups.add_members(person, space.id, [%{
      id: person.id,
      permissions: Binding.view_access(),
    }])
  end
end
