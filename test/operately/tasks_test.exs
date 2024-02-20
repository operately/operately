defmodule Operately.TasksTest do
  use Operately.DataCase

  alias Operately.Tasks

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.TasksFixtures
  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.TasksFixtures

  setup do
    company = company_fixture(%{name: "Acme"})
    person = person_fixture(%{company_id: company.id})
    space = group_fixture(person, %{company_id: company.id})

    project = project_fixture(%{
      company_id: company.id,
      creator_id: person.id,
      champion_id: person.id,
      reviewer_id: person.id,
      group_id: space.id,
    })

    milestone = milestone_fixture(person, %{project_id: project.id})

    task = task_fixture(%{
      space_id: space.id, 
      creator_id: person.id, 
      milestone_id: milestone.id,
      status: "todo",
    })

    {:ok, company: company, space: space, task: task, person: person, milestone: milestone, project: project}
  end

  describe "tasks" do
    test "list_tasks with space_id returns tasks for that space", ctx do
      assert Tasks.list_tasks(%{milestone_id: ctx.milestone.id}) == [ctx.task]
    end

    test "get_task!/1 returns the task with given id", ctx do
      assert Tasks.get_task!(ctx.task.id) == ctx.task
    end
  end

  describe "task_assignees" do
    test "list_task_assignees/0 returns all task_assignees", ctx do
      assignee = assignee_fixture(%{task_id: ctx.task.id, person_id: ctx.person.id})
      assert Tasks.list_task_assignees(ctx.task) == [assignee]
    end
  end
end
