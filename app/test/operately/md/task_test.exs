defmodule Operately.MD.TaskTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  test "it renders project task associations from a bare task struct" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: space.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: creator.id, title: "Roadmap Milestone"})
    task = task_fixture(%{creator_id: creator.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Task"})

    raw_task = Repo.get!(Operately.Tasks.Task, task.id)
    rendered = Operately.MD.Task.render(raw_task)

    assert rendered =~ "Type: Project Task"
    assert rendered =~ "Creator: Taylor Creator"
    assert rendered =~ "Space: Roadmap Space"
    assert rendered =~ "Project: Roadmap Project"
    assert rendered =~ "Milestone: Roadmap Milestone"
    assert rendered =~ "Assignees: Unassigned"
  end

  test "it renders loaded project task associations" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    assignee = person_fixture(%{company_id: company.id, full_name: "Jordan Assignee"})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: space.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: creator.id, title: "Roadmap Milestone"})
    task = task_fixture(%{creator_id: creator.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Task"})
    assignee_fixture(%{task_id: task.id, person_id: assignee.id})

    rendered = task |> Repo.reload() |> Operately.MD.Task.render()

    assert rendered =~ "Type: Project Task"
    assert rendered =~ "Creator: Taylor Creator"
    assert rendered =~ "Space: Roadmap Space"
    assert rendered =~ "Project: Roadmap Project"
    assert rendered =~ "Milestone: Roadmap Milestone"
    assert rendered =~ "Assignees: Jordan Assignee"
  end

  test "it renders space tasks without project-only fields" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    creator = person_fixture(%{company_id: company.id, full_name: "Taylor Creator"})
    space = group_fixture(creator, %{company_id: company.id, name: "Roadmap Space"})
    task = task_fixture(%{creator_id: creator.id, space_id: space.id, name: "Roadmap Space Task"})

    rendered = task |> Repo.reload() |> Operately.MD.Task.render()

    assert rendered =~ "Type: Space Task"
    assert rendered =~ "Space: Roadmap Space"
    refute rendered =~ "Project:"
    refute rendered =~ "Milestone:"
  end
end
