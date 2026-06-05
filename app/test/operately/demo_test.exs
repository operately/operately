defmodule Operately.DemoTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.PeopleFixtures

  alias Operately.Activities.NotificationDispatcher

  test "it creates a demo company without failures" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")
    assert %Operately.Companies.Company{} = company
    assert Operately.Companies.get_company_by_name("Acme Inc.")
  end

  test "it does not enqueue activity notification jobs while building the demo" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")
      assert %Operately.Companies.Company{} = company
      assert all_enqueued(worker: NotificationDispatcher) == []
    end)
  end

  test "most demo people have descriptions" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")

    people = Operately.People.list_people(company.id)
    described_count = Enum.count(people, fn person -> person.description end)

    assert described_count > div(length(people), 2)
  end

  test "all demo goals have descriptions" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")

    goals = Operately.Goals.list_goals(%{company_id: company.id, space_id: nil})

    assert length(goals) > 0

    assert Enum.all?(goals, fn goal ->
             description =
               goal.description
               |> Operately.MD.RichText.render()
               |> String.trim()

             description != ""
           end)
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
            %{title: "M2", status: :pending}
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

  test "project check-in history" do
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
          check_ins: [
            %{status: :caution, content: "First check-in", days_ago: 14},
            %{status: :on_track, content: "Second check-in", days_ago: 7},
          ],
          milestones: []
        },
      ]
    }

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO", data)
    assert {:ok, project} = Operately.Projects.Project.get(:system, company_id: company.id, name: "Alpha", opts: [preload: :check_ins])

    assert length(project.check_ins) == 2
    assert Enum.any?(project.check_ins, &(&1.status == :caution))
    assert Enum.any?(project.check_ins, &(&1.status == :on_track))
    assert Enum.any?(project.check_ins, &(Date.diff(Date.utc_today(), NaiveDateTime.to_date(&1.inserted_at)) == 14))
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

    assert goal1.timeframe.contextual_start_date.date_type == :year
    assert goal1.timeframe.contextual_end_date.date_type == :year

    assert goal2.timeframe.contextual_start_date.date_type == :quarter
    assert goal2.timeframe.contextual_end_date.date_type == :quarter

    assert Operately.MD.RichText.render(goal1.description) =~ "yearly goal"
    assert Operately.MD.RichText.render(goal2.description) =~ "quarterly goal"
  end

  test "goal update status" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    data = %{
      people: [],
      spaces: [],
      goals: [
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
          update: %{
            status: :caution,
            content: "Progress needs attention.",
            target_values: [1, 2],
          },
        }
      ],
      projects: []
    }

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO", data)
    assert {:ok, goal} = Operately.Goals.Goal.get(:system, company_id: company.id, name: "Quarterly Goal")

    assert goal.last_update_status == :caution
  end
end
