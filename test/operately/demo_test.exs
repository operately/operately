defmodule Operately.DemoTest do
  use Operately.DataCase

  import Operately.PeopleFixtures

  test "it creates a demo company without failures" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")
    assert %Operately.Companies.Company{} = company
    assert Operately.Companies.get_company_by_name("Acme Inc.")
  end

  test "milestone creation" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    data = %{
      people: [],
      spaces: [],
      goals: [],
      projects: [
        %{
          key: :alpha,
          name: "Alpha",
          space: :company_space,
          champion: :owner,
          contributors: [],
          check_in: nil,
          milestones: [
            %{title: "M1", status: :done},
            %{title: "M2", status: :pending},
          ]
        },
      ]
    }

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO", data)
    assert {:ok, project} = Operately.Projects.Project.get(:system, company_id: company.id, name: "Alpha")
    assert {:ok, m1} = Operately.Projects.Milestone.get(:system, project_id: project.id, title: "M1")
    assert {:ok, m2} = Operately.Projects.Milestone.get(:system, project_id: project.id, title: "M2")

    assert m1.status == :done
    assert m2.status == :pending
  end
end
