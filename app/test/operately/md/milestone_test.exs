defmodule Operately.MD.MilestoneTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  test "it renders milestone resources from a bare milestone struct" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: space.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: creator.id, title: "Roadmap Milestone"})

    raw_milestone = Repo.get!(Operately.Projects.Milestone, milestone.id)
    rendered = Operately.MD.Milestone.render(raw_milestone)

    assert rendered =~ "Project: Roadmap Project"
    assert rendered =~ "Space: Roadmap Space"
    assert rendered =~ "Creator: Taylor Creator"
    assert rendered =~ "## Tasks"
    assert rendered =~ "_No tasks yet._"
  end

  test "it renders loaded milestone resources and tasks" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    assignee = person_fixture(%{company_id: company.id, full_name: "Jordan Assignee"})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: space.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: creator.id, title: "Roadmap Milestone"})
    task = task_fixture(%{creator_id: creator.id, milestone_id: milestone.id, project_id: project.id, name: "Milestone Task"})
    assignee_fixture(%{task_id: task.id, person_id: assignee.id})

    rendered = milestone |> Repo.reload() |> Operately.MD.Milestone.render()

    assert rendered =~ "Project: Roadmap Project"
    assert rendered =~ "Space: Roadmap Space"
    assert rendered =~ "Creator: Taylor Creator"
    assert rendered =~ "## Tasks"
    assert rendered =~ task.name
    assert rendered =~ "Assigned to: Jordan Assignee"
  end

  test "it renders no tasks when there are none" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: space.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: creator.id, title: "Roadmap Milestone"})

    rendered = milestone |> Repo.reload() |> Operately.MD.Milestone.render()

    assert rendered =~ "## Tasks"
    assert rendered =~ "_No tasks yet._"
  end
end
