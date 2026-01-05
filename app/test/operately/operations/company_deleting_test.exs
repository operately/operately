defmodule Operately.Operations.CompanyDeletingTest do
  use Operately.DataCase
  import Ecto.Query

  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Goals.Goal
  alias Operately.Projects.Milestone
  alias Operately.Tasks.Task
  alias Operately.People.Person

  setup do
    account =
      Operately.PeopleFixtures.account_fixture(%{
        full_name: "Peter Parker",
        email: "peter.parker@localhost"
      })

    {:ok, company} = Operately.Demo.run(account, "Acme Inc.", "CEO")

    {:ok, company: company}
  end

  test "it deletes a company", ctx do
    assert {:ok, _} = Operately.Operations.CompanyDeleting.run(ctx.company.id)
    assert Repo.get_by(Operately.Companies.Company, id: ctx.company.id) == nil
  end

  test "deletes company and all its resources, leaving others intact", ctx do
    # Create another company
    account = Operately.PeopleFixtures.account_fixture(%{
      full_name: "Bruce Wayne",
      email: "bruce.wayne@localhost"
    })
    {:ok, other_company} = Operately.Demo.run(account, "Wayne Enterprises", "CEO")

    # Initial counts
    ctx_resources = count_resources(ctx.company.id)
    other_resources = count_resources(other_company.id)

    # Ensure we have something to delete
    assert ctx_resources.spaces > 0
    assert ctx_resources.projects > 0
    assert ctx_resources.goals > 0
    assert ctx_resources.people > 0
    assert ctx_resources.milestones > 0
    assert ctx_resources.tasks > 0

    # Run deletion
    assert {:ok, _} = Operately.Operations.CompanyDeleting.run(ctx.company.id)

    # Verify deleted company resources are gone
    deleted_resources = count_resources(ctx.company.id)
    assert deleted_resources.spaces == 0
    assert deleted_resources.projects == 0
    assert deleted_resources.goals == 0
    assert deleted_resources.people == 0
    assert deleted_resources.milestones == 0
    assert deleted_resources.tasks == 0

    # Verify other company resources are intact
    assert other_resources == count_resources(other_company.id)

    # Verify company itself is gone
    assert Repo.get(Operately.Companies.Company, ctx.company.id) == nil
    # Verify other company is present
    assert Repo.get(Operately.Companies.Company, other_company.id)
  end

  defp count_resources(company_id) do
    spaces = Repo.aggregate(from(s in Group, where: s.company_id == ^company_id), :count)
    projects = Repo.aggregate(from(p in Project, where: p.company_id == ^company_id), :count)
    goals = Repo.aggregate(from(g in Goal, where: g.company_id == ^company_id), :count)
    people = Repo.aggregate(from(p in Person, where: p.company_id == ^company_id), :count)

    milestones = Repo.aggregate(from(m in Milestone, join: p in assoc(m, :project), where: p.company_id == ^company_id), :count)

    # Tasks can belong to project or space
    tasks = Repo.aggregate(from(t in Task,
      left_join: p in assoc(t, :project),
      left_join: s in assoc(t, :space),
      where: p.company_id == ^company_id or s.company_id == ^company_id
    ), :count)

    %{spaces: spaces, projects: projects, goals: goals, people: people, milestones: milestones, tasks: tasks}
  end
end
