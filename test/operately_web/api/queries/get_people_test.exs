defmodule OperatelyWeb.Api.Queries.GetPeopleTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

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
      assert length(people) == 1
      assert Enum.at(people, 0).id == me.id
      refute Enum.find(people, fn person -> person.id == person_from_other_company.id end)
    end
  end

  describe "get_people functionality" do
    setup :register_and_log_in_account

    test "returns all people from the company", ctx do
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      person2 = person_fixture(company_id: ctx.company.id, full_name: "Jane Doe")
      person3 = person_fixture(company_id: ctx.company.id, full_name: "Michael Johnson")

      all_people = [ctx.person, person1, person2, person3] |> Enum.sort_by(&(&1.full_name))

      assert {200, res} = query(ctx.conn, :get_people, %{})
      assert res == %{people: Serializer.serialize(all_people, level: :essential)}
    end

    test "it doesn't return suspended accounts", ctx do
      suspended_person = person_fixture(company_id: ctx.company.id, suspended: true)
      active_person = person_fixture(company_id: ctx.company.id)

      assert {200, %{people: people}} = query(ctx.conn, :get_people, %{})
      assert Enum.find(people, fn person -> person.id == active_person.id end)
      refute Enum.find(people, fn person -> person.id == suspended_person.id end)
    end

    test "it returns suspended accounts if include_suspended is true", ctx do
      suspended_person = person_fixture(company_id: ctx.company.id, suspended: true)
      active_person = person_fixture(company_id: ctx.company.id)

      assert {200, %{people: people}} = query(ctx.conn, :get_people, %{include_suspended: true})
      assert Enum.find(people, fn person -> person.id == active_person.id end)
      assert Enum.find(people, fn person -> person.id == suspended_person.id end)
    end
  end
end 
