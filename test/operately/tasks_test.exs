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

  describe "task_assignees" do
    alias Operately.Tasks.Assignee

    import Operately.TasksFixtures

    @invalid_attrs %{}

    test "list_task_assignees/0 returns all task_assignees" do
      assignee = assignee_fixture()
      assert Tasks.list_task_assignees() == [assignee]
    end

    test "get_assignee!/1 returns the assignee with given id" do
      assignee = assignee_fixture()
      assert Tasks.get_assignee!(assignee.id) == assignee
    end

    test "create_assignee/1 with valid data creates a assignee" do
      valid_attrs = %{}

      assert {:ok, %Assignee{} = assignee} = Tasks.create_assignee(valid_attrs)
    end

    test "create_assignee/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Tasks.create_assignee(@invalid_attrs)
    end

    test "update_assignee/2 with valid data updates the assignee" do
      assignee = assignee_fixture()
      update_attrs = %{}

      assert {:ok, %Assignee{} = assignee} = Tasks.update_assignee(assignee, update_attrs)
    end

    test "update_assignee/2 with invalid data returns error changeset" do
      assignee = assignee_fixture()
      assert {:error, %Ecto.Changeset{}} = Tasks.update_assignee(assignee, @invalid_attrs)
      assert assignee == Tasks.get_assignee!(assignee.id)
    end

    test "delete_assignee/1 deletes the assignee" do
      assignee = assignee_fixture()
      assert {:ok, %Assignee{}} = Tasks.delete_assignee(assignee)
      assert_raise Ecto.NoResultsError, fn -> Tasks.get_assignee!(assignee.id) end
    end

    test "change_assignee/1 returns a assignee changeset" do
      assignee = assignee_fixture()
      assert %Ecto.Changeset{} = Tasks.change_assignee(assignee)
    end
  end
end
