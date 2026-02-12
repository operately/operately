defmodule OperatelyWeb.Api.Queries.ListPossibleManagersTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  alias OperatelyWeb.Paths

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :list_possible_managers, user_id: "some-id")
    end

    test "returns people only from the company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)
        |> Factory.add_company_member(:member)

      other_company = company_fixture(name: "Other Company")
      _person2 = person_fixture(company_id: other_company.id)

      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(ctx.creator))
      assert Enum.map(res.people, & &1.id) |> Enum.member?(Paths.person_id(ctx.member))
      assert length(res.people) == 1
    end

    test "returns empty list for user_id from another company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.log_in_person(:creator)

      # Create another company with a user
      other_company = company_fixture(name: "Other Company")
      other_user = person_fixture(company_id: other_company.id)

      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(other_user))

      assert length(res.people) == 0
    end
  end

  describe "list_possible_managers functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
    end

    test "excludes the user themselves", ctx do
      ctx = Factory.add_company_member(ctx, :member)

      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(ctx.creator))

      assert length(res.people) == 1
      assert Enum.all?(res.people, fn p -> p.id != ctx.creator.id end)
    end

    test "excludes direct reports", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:report, manager_id: ctx.creator.id)
        |> Factory.add_company_member(:other_person)

      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(ctx.creator))

      assert length(res.people) == 1
      assert Enum.find(res.people, fn p -> p.id == Paths.person_id(ctx.other_person) end)
    end

    test "excludes indirect reports", ctx do
      # Create a hierarchy: ctx.person -> direct_report -> indirect_report
      ctx = Factory.add_company_member(ctx, :direct_report, manager_id: ctx.creator.id)
      ctx = Factory.add_company_member(ctx, :indirect_report, manager_id: ctx.direct_report.id)

      # Create another person who is not in the reporting chain
      ctx = Factory.add_company_member(ctx, :other_person)

      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(ctx.creator))

      # Check that both direct and indirect reports are excluded
      assert Enum.all?(res.people, fn p -> p.id != Paths.person_id(ctx.direct_report) end)
      assert Enum.all?(res.people, fn p -> p.id != Paths.person_id(ctx.indirect_report) end)

      # Check that the other person is included
      assert Enum.any?(res.people, fn p -> p.id == Paths.person_id(ctx.other_person) end)
    end

    test "excludes suspended people", ctx do
      ctx = Factory.add_company_member(ctx, :active_person)
      ctx = Factory.add_company_member(ctx, :suspended_person, suspended: true)

      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(ctx.creator))

      # Check that the active person is included
      assert Enum.any?(res.people, fn p -> p.id == Paths.person_id(ctx.active_person) end)

      # Check that the suspended person is excluded
      assert Enum.all?(res.people, fn p -> p.id != Paths.person_id(ctx.suspended_person) end)
    end

    test "defaults to current user when user_id is not provided", ctx do
      ctx = Factory.add_company_member(ctx, :report, manager_id: ctx.creator.id)
      ctx = Factory.add_company_member(ctx, :other_person)

      assert {200, res} = query(ctx.conn, :list_possible_managers, [])

      assert Enum.all?(res.people, fn p -> p.id != Paths.person_id(ctx.report) end)
      assert Enum.all?(res.people, fn p -> p.id != Paths.person_id(ctx.creator) end)
      assert Enum.any?(res.people, fn p -> p.id == Paths.person_id(ctx.other_person) end)
    end
  end

  describe "guest access control" do
    test "guest without view access returns empty list", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:member1)
        |> Factory.add_company_member(:member2)
        |> Factory.add_company_member(:member3)
        |> Factory.add_company_member(:member4)
        |> Factory.add_outside_collaborator(:guest, :creator)
        |> Factory.log_in_person(:guest)

      # Guest queries for possible managers
      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(ctx.member1))
      assert res.people == []

      # Company member queries for possible managers
      ctx = Factory.log_in_person(ctx, :member4)

      assert {200, res} = query(ctx.conn, :list_possible_managers, user_id: Paths.person_id(ctx.member1))
      assert length(res.people) == 5
    end
  end

  def serialized(person) do
    OperatelyWeb.Api.Serializer.serialize(person, level: :essential)
  end
end
