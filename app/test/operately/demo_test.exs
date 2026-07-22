defmodule Operately.DemoTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.PeopleFixtures

  alias Operately.Activities.NotificationDispatcher
  alias Operately.ResourceHubs.DocumentVersion
  alias Operately.Repo

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

  test "creates documents and links in project and goal resource hubs" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")

    assert {:ok, project} =
             Operately.Projects.Project.get(:system, company_id: company.id, name: "Ship collaborative docs beta")

    assert {:ok, goal} =
             Operately.Goals.Goal.get(:system, company_id: company.id, name: "Grow self-serve revenue")

    project_hub = Operately.ResourceHubs.list_resource_hubs(project) |> List.first()
    goal_hub = Operately.ResourceHubs.list_resource_hubs(goal) |> List.first()

    project_documents = Operately.ResourceHubs.list_documents(project_hub)
    project_links = Operately.ResourceHubs.list_links(project_hub)
    goal_documents = Operately.ResourceHubs.list_documents(goal_hub)
    goal_links = Operately.ResourceHubs.list_links(goal_hub)

    assert Enum.any?(project_documents, &(&1.name == "Collaborative Docs Beta Release Plan"))
    assert Enum.any?(project_links, &(&1.type == :figma))
    assert Enum.any?(goal_documents, &(&1.name == "Self-Serve Growth Experiments Log"))
    assert Enum.any?(goal_links, &(&1.type == :google_sheet))
  end

  test "demo documents capture version history" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")

    documents = company_documents(company.id)
    assert length(documents) > 0

    Enum.each(documents, fn document ->
      versions = DocumentVersion.list_for_document(document.id)
      version_numbers = Enum.map(versions, & &1.version_number) |> Enum.sort()

      assert document.current_version == length(versions)
      assert version_numbers == Enum.to_list(1..document.current_version)
      assert Enum.find(versions, &(&1.version_number == 1)).origin == :created
      assert Enum.find(versions, &(&1.version_number == document.current_version)).title == document.name
    end)

    playbook = Enum.find(documents, &(&1.name == "Product Development Playbook"))
    beta_plan = Enum.find(documents, &(&1.name == "Collaborative Docs Beta Release Plan"))
    experiments = Enum.find(documents, &(&1.name == "Self-Serve Growth Experiments Log"))

    assert playbook.current_version == 2
    assert beta_plan.current_version == 2
    assert experiments.current_version == 2

    assert Enum.find(DocumentVersion.list_for_document(playbook.id), &(&1.version_number == 2)).origin == :edited
    assert Enum.find(DocumentVersion.list_for_document(beta_plan.id), &(&1.version_number == 2)).origin == :edited
  end

  test "document edits create sequential versions" do
    account = account_fixture(%{full_name: "Peter Parker", email: "peter.parker@localhost"})

    data = %{
      people: [],
      spaces: [],
      goals: [],
      projects: [],
      documents: [
        %{
          key: :handbook,
          space: :company_space,
          name: "Handbook",
          days_ago: 5,
          content: "First draft",
          edits: [
            %{
              author: :owner,
              days_ago: 2,
              name: "Company Handbook",
              content: "Second draft with title change"
            }
          ]
        }
      ]
    }

    assert {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO", data)

    document =
      company_documents(company.id)
      |> Enum.find(&(&1.name == "Company Handbook"))

    versions = DocumentVersion.list_for_document(document.id) |> Enum.sort_by(& &1.version_number)

    assert document.current_version == 2
    assert Enum.map(versions, &{&1.version_number, &1.origin, &1.title}) == [
             {1, :created, "Handbook"},
             {2, :edited, "Company Handbook"}
           ]

    assert Date.diff(Date.utc_today(), NaiveDateTime.to_date(Enum.at(versions, 0).inserted_at)) == 5
    assert Date.diff(Date.utc_today(), NaiveDateTime.to_date(Enum.at(versions, 1).inserted_at)) == 2
  end

  defp company_documents(company_id) do
    import Ecto.Query

    from(d in Operately.ResourceHubs.Document,
      join: n in assoc(d, :node),
      join: h in assoc(n, :resource_hub),
      left_join: s in assoc(h, :space),
      left_join: p in assoc(h, :project),
      left_join: g in assoc(h, :goal),
      where: s.company_id == ^company_id or p.company_id == ^company_id or g.company_id == ^company_id
    )
    |> Repo.all()
  end
end
