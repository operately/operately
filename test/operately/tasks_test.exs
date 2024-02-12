defmodule Operately.TasksTest do
  use Operately.DataCase

  alias Operately.Tasks

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.TasksFixtures
  import Operately.PeopleFixtures

  setup do
    company = company_fixture(%{name: "Acme"})
    person = person_fixture(%{company_id: company.id})
    space = group_fixture(person, %{company_id: company.id})
    task = task_fixture(%{
      space_id: space.id, 
      creator_id: person.id, 
      assignee_id: person.id,
      size: "small",
      priority: "high",
      due_date: ~N[2024-02-11 13:27:00]
    })

    {:ok, company: company, space: space, task: task, person: person}
  end

  describe "tasks" do
    test "list_tasks/0 returns all tasks", ctx do
      assert Tasks.list_tasks(%{space_id: ctx.space.id}) == [ctx.task]
    end

    test "get_task!/1 returns the task with given id", ctx do
      assert Tasks.get_task!(ctx.task.id) == ctx.task
    end
  end
end
