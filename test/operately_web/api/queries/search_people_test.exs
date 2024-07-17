defmodule OperatelyWeb.Api.Queries.SearchPeopleTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :search_people, query: "John", ignored_ids: [])
    end

    test "returns people only from the company", ctx do
      ctx = register_and_log_in_account(ctx)
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")

      other_company = company_fixture(name: "Other Company")
      _person2 = person_fixture(company_id: other_company.id, full_name: "John Doe")

      assert {200, res} = query(ctx.conn, :search_people, query: "John", ignored_ids: [])
      assert res == %{people: [serialized(person1)]}
    end
  end

  describe "search_people functionality" do
    setup :register_and_log_in_account

    test "searches people by name", ctx do
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      _person2 = person_fixture(company_id: ctx.company.id, full_name: "Jane Doe")
      person3 = person_fixture(company_id: ctx.company.id, full_name: "Michael Johnson")

      assert {200, res} = query(ctx.conn, :search_people, query: "John", ignored_ids: [])
      assert res == %{people: [serialized(person1), serialized(person3)]}
    end

    test "searches people by title", ctx do
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Doe", title: "Developer")
      person2 = person_fixture(company_id: ctx.company.id, full_name: "Jane Doe", title: "Backend Developer")
      _person3 = person_fixture(company_id: ctx.company.id, full_name: "Michael Johnson", title: "Designer")

      assert {200, res} = query(ctx.conn, :search_people, query: "Developer", ignored_ids: [])
      assert res == %{people: [serialized(person1), serialized(person2)]}
    end

    test "returns up to 10 matches", ctx do
      (1..15) |> Enum.map(fn index -> person_fixture(company_id: ctx.company.id, full_name: "John Doe #{index}") end)

      assert {200, res} = query(ctx.conn, :search_people, query: "John", ignored_ids: [])
      assert length(res.people) == 10
    end

    test "orders by the best prefix match on full name", ctx do
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Adam Smith") # index of match: 10
      person2 = person_fixture(company_id: ctx.company.id, full_name: "John Smith") # index of match: 6
      person3 = person_fixture(company_id: ctx.company.id, full_name: "John Adam Richard Smith") # index of match: 18

      assert {200, res} = query(ctx.conn, :search_people, query: "Smith", ignored_ids: [])
      assert res == %{people: [serialized(person2), serialized(person1), serialized(person3)]}
    end

    test "ignoring people by id", ctx do
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      person2 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")

      assert {200, res} = query(ctx.conn, :search_people, query: "John", ignored_ids: [person1.id])
      assert res == %{people: [serialized(person2)]}
    end

    test "excludes suspended people", ctx do
      person1 = person_fixture(company_id: ctx.company.id, full_name: "John Doe")
      _person2 = person_fixture(company_id: ctx.company.id, full_name: "John Doe", suspended: true)

      assert {200, res} = query(ctx.conn, :search_people, query: "John", ignored_ids: [])
      assert res == %{people: [serialized(person1)]}
    end
  end

  def serialized(person) do
    OperatelyWeb.Api.Serializer.serialize(person, level: :essential)
  end
end
