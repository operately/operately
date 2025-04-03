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

  test "goal creation" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    data = %{
      people: [],
      spaces: [],
      goals: [
        %{
          key: :yearly_goal,
          name: "Yearly Goal",
          space: :company_space,
          champion: :owner,
          reviewer: :owner,
          timeframe: :current_year,
          targets: [
            %{name: "A", from: 0, to: 5, unit: "units"},
            %{name: "B", from: 0, to: 5, unit: "units"},
          ],
          update: nil,
        },
        %{
          key: :quarterly_goal,
          name: "Quarterly Goal",
          space: :company_space,
          champion: :owner,
          reviewer: :owner,
          targets: [
            %{name: "A", from: 0, to: 5, unit: "units"},
            %{name: "B", from: 0, to: 5, unit: "units"},
          ],
          update: nil,
        }
      ],
      projects: []
    }

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO", data)
    assert {:ok, goal1} = Operately.Goals.Goal.get(:system, company_id: company.id, name: "Yearly Goal")
    assert {:ok, goal2} = Operately.Goals.Goal.get(:system, company_id: company.id, name: "Quarterly Goal")

    assert goal1.timeframe.type == "year"
    assert goal2.timeframe.type == "quarter"
  end
end
