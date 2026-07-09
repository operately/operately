defmodule Operately.People.ManagerCycleTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.People
  alias Operately.People.{ManagerCycle, Person}
  alias Operately.Repo

  describe "postgres_cycle_error?/1" do
    setup do
      company = company_fixture()
      alice = person_fixture(%{full_name: "Alice", company_id: company.id})
      bob = person_fixture(%{full_name: "Bob", company_id: company.id})
      carol = person_fixture(%{full_name: "Carol", company_id: company.id})

      {:ok, _} = People.update_person(bob, %{manager_id: alice.id})
      {:ok, _} = People.update_person(carol, %{manager_id: bob.id})

      {:ok, %{alice: alice, carol: carol}}
    end

    test "detects the manager cycle trigger error from postgres metadata", %{alice: alice, carol: carol} do
      error =
        try do
          alice
          |> Person.changeset(%{manager_id: carol.id})
          |> Repo.update!()
        rescue
          e in Postgrex.Error -> e
        end

      assert ManagerCycle.postgres_cycle_error?(error)
      refute ManagerCycle.postgres_cycle_error?(%Postgrex.Error{postgres: %{code: :raise_exception, where: "other function"}})
    end
  end
end
