defmodule OperatelyWeb.Api.Queries.GetPersonTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_person, %{})
    end

    test "it doesn't return people from other companies", ctx do
      ctx = register_and_log_in_account(ctx)

      company2 = company_fixture(name: "Company 2")
      person_from_other_company = person_fixture(%{company_id: company2.id})

      assert {404, "Not found"} = query(ctx.conn, :get_person, %{id: person_from_other_company.id})
    end
  end

  describe "get_person functionality" do
    setup :register_and_log_in_account

    test "returns the person", ctx do
      person = person_fixture(company_id: ctx.company.id)
      assert {200, res} = query(ctx.conn, :get_person, %{id: person.id})
      assert res.person == serialized(person, [:theme])
    end

    test "includes the manager if requested and present", ctx do
      manager = person_fixture(company_id: ctx.company.id)
      person = person_fixture(company_id: ctx.company.id, manager_id: manager.id)
      assert {200, res} = query(ctx.conn, :get_person, %{id: person.id, include_manager: true})

      assert res.person == serialized(person, [:theme, {:manager, manager}])
    end

    test "if manager is not present, it doesn't include it, even if requested", ctx do
      person = person_fixture(company_id: ctx.company.id)
      assert {200, res} = query(ctx.conn, :get_person, %{id: person.id, include_manager: true})
      assert res.person == serialized(person, [:theme, {:manager, nil}])
    end

    test "includes reports if requested", ctx do
      person = person_fixture(company_id: ctx.company.id)
      report1 = person_fixture(company_id: ctx.company.id, manager_id: person.id)
      report2 = person_fixture(company_id: ctx.company.id, manager_id: person.id)
      assert {200, res} = query(ctx.conn, :get_person, %{id: person.id, include_reports: true})
      assert res.person == serialized(person, [:theme, {:reports, [report1, report2]}])
    end

    test "includes peers if requested", ctx do
      manager = person_fixture(company_id: ctx.company.id)
      person = person_fixture(company_id: ctx.company.id, manager_id: manager.id)
      peer1 = person_fixture(company_id: ctx.company.id, manager_id: manager.id)
      peer2 = person_fixture(company_id: ctx.company.id, manager_id: manager.id)

      assert {200, res} = query(ctx.conn, :get_person, %{id: person.id, include_peers: true})
      assert res.person == serialized(person, [:theme, {:peers, [peer1, peer2]}])
    end
  end

  defp serialized(nil), do: nil
  defp serialized(person) do
    %{
      id: person.id,
      full_name: person.full_name,
      email: person.email,
      avatar_url: person.avatar_url,
      title: person.title,
      manager_id: person.manager_id,
      suspended: person.suspended
    }
  end

  defp serialized(person, []) do
    serialized(person)
  end

  defp serialized(person, [:theme | rest]) do
    serialized(person, rest) |> Map.merge(%{theme: person.theme || "system"})
  end

  defp serialized(person, [{:manager, manager} | rest]) do
    serialized(person, rest) |> Map.merge(%{manager: serialized(manager)})
  end

  defp serialized(person, [{:reports, reports} | rest]) do
    serialized(person, rest) |> Map.merge(%{reports: Enum.map(reports, &serialized/1)})
  end

  defp serialized(person, [{:peers, peers} | rest]) do
    serialized(person, rest) |> Map.merge(%{peers: Enum.map(peers, &serialized/1)})
  end
end 
