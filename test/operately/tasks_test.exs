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
    test "list_tasks with space_id returns tasks for that space", ctx do
      assert Tasks.list_tasks(%{space_id: ctx.space.id}) == [ctx.task]
    end

    test "list_tasks with status returns tasks with that status", ctx do
      task1 = task_fixture(%{space_id: ctx.space.id, status: :closed, size: "small", priority: "high", due_date: ~N[2024-02-11 13:27:00], creator_id: ctx.person.id, assignee_id: ctx.person.id})
      task2 = task_fixture(%{space_id: ctx.space.id, status: :open, size: "small", priority: "high", due_date: ~N[2024-02-11 13:27:00], creator_id: ctx.person.id, assignee_id: ctx.person.id})

      assert get_ids(Tasks.list_tasks(%{space_id: ctx.space.id, status: :closed})) == [task1.id]
      assert get_ids(Tasks.list_tasks(%{space_id: ctx.space.id, status: :open})) == [ctx.task.id, task2.id]
    end

    test "get_task!/1 returns the task with given id", ctx do
      assert Tasks.get_task!(ctx.task.id) == ctx.task
    end
  end

  defp get_ids(tasks) do
    Enum.map(tasks, & &1.id)
  end
end
