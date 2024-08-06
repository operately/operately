defmodule OperatelyWeb.Api.Queries.GetPeopleTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.{Repo, People}

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_people, %{})
    end

    test "it doesn't return people from other companies", ctx do
      ctx = register_and_log_in_account(ctx)
      me = ctx.person

      company2 = company_fixture(name: "Company 2")
      person_from_other_company = person_fixture(%{company_id: company2.id})

      assert {200, %{people: people}} = query(ctx.conn, :get_people, %{})
      assert length(people) == 2 # me and the company creator
      assert Enum.any?(people, fn p -> p.id == Paths.person_id(me) end)
      assert Enum.any?(people, fn p -> p.id == Paths.person_id(ctx.company_creator) end)
      refute find_person_in_response(people, person_from_other_company)
    end
  end

  describe "permissions" do
    setup :register_and_log_in_account

    test "company member can query people from the same company", ctx do
      assert {200, res} = query(ctx.conn, :get_people, %{})
      assert length(res.people) == 2 # created in the setup

      people = Enum.map(1..3, fn _ ->
        person_fixture(%{company_id: ctx.company.id})
      end)

      assert {200, res} = query(ctx.conn, :get_people, %{})
      assert length(res.people) == 5

      Enum.each(people, fn p ->
        assert Enum.find(res.people, &(&1 == Serializer.serialize(p, level: :full)))
      end)
    end

    test "company member can't query people from another company", ctx do
      %{company: company2, conn: conn2} = register_and_log_in_account(ctx)

      Enum.each(1..3, fn _ ->
        person_fixture(%{company_id: company2.id})
      end)

      assert {200, res} = query(conn2, :get_people, %{})
      assert length(res.people) == 5 # 2 from setup2 + 3 just created

      assert {200, res} = query(ctx.conn, :get_people, %{})
      assert length(res.people) == 2 # only 2 from the setup

      assert Repo.aggregate(People.Person, :count, :id) == 7 # total
    end

    test "suspended people don't have access", ctx do
      assert {200, res} = query(ctx.conn, :get_people, %{})
      assert length(res.people) == 2

      People.update_person(ctx.person, %{suspended_at: DateTime.utc_now()})

      assert {200, res} = query(ctx.conn, :get_people, %{})
      assert length(res.people) == 0
    end
  end

  describe "get_people functionality" do
    setup :register_and_log_in_account

    test "returns all people from the company", ctx do
      person0 = ctx.company_creator
      person1 = ctx.person
      person2 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      person3 = person_fixture(company_id: ctx.company.id, full_name: "Jane Doe")
      person4 = person_fixture(company_id: ctx.company.id, full_name: "Michael Johnson")

      all_people = [person0, person1, person2, person3, person4] |> Enum.sort_by(&(&1.full_name))

      assert {200, res} = query(ctx.conn, :get_people, %{})
      assert res == %{people: Serializer.serialize(all_people, level: :full)}
    end

    test "include_suspeded", ctx do
      suspended_person = person_fixture(company_id: ctx.company.id, suspended_at: DateTime.utc_now())
      active_person = person_fixture(company_id: ctx.company.id)

      assert {200, %{people: people}} = query(ctx.conn, :get_people, %{})
      assert find_person_in_response(people, active_person)
      refute find_person_in_response(people, suspended_person)

      assert {200, %{people: people}} = query(ctx.conn, :get_people, %{include_suspended: true})
      assert find_person_in_response(people, suspended_person)
      assert find_person_in_response(people, active_person)
    end

    test "include_manager", ctx do
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      person2 = person_fixture(company_id: ctx.company.id, full_name: "Jane Doe")
      person3 = person_fixture(company_id: ctx.company.id, full_name: "Michael Johnson", manager_id: person1.id)

      assert {200, res} = query(ctx.conn, :get_people, %{include_manager: true})
      assert find_person_in_response(res.people, person1).manager == nil
      assert find_person_in_response(res.people, person2).manager == nil
      assert find_person_in_response(res.people, person3).manager == Serializer.serialize(person1, level: :essential)
    end
  end

  defp find_person_in_response(people, person) do
    Enum.find(people, fn p -> p.id == Paths.person_id(person) end)
  end
end
