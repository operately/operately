defmodule Operately.TasksTest do
  use Operately.DataCase

  alias Operately.Tasks

  describe "tasks" do
    alias Operately.Tasks.Task

    import Operately.TasksFixtures

    @invalid_attrs %{description: nil, due_date: nil, name: nil, priority: nil, size: nil}

    test "list_tasks/0 returns all tasks" do
      task = task_fixture()
      assert Tasks.list_tasks() == [task]
    end

    test "get_task!/1 returns the task with given id" do
      task = task_fixture()
      assert Tasks.get_task!(task.id) == task
    end

    test "create_task/1 with valid data creates a task" do
      valid_attrs = %{description: %{}, due_date: ~N[2024-02-11 13:27:00], name: "some name", priority: "some priority", size: "some size"}

      assert {:ok, %Task{} = task} = Tasks.create_task(valid_attrs)
      assert task.description == %{}
      assert task.due_date == ~N[2024-02-11 13:27:00]
      assert task.name == "some name"
      assert task.priority == "some priority"
      assert task.size == "some size"
    end

    test "create_task/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Tasks.create_task(@invalid_attrs)
    end

    test "update_task/2 with valid data updates the task" do
      task = task_fixture()
      update_attrs = %{description: %{}, due_date: ~N[2024-02-12 13:27:00], name: "some updated name", priority: "some updated priority", size: "some updated size"}

      assert {:ok, %Task{} = task} = Tasks.update_task(task, update_attrs)
      assert task.description == %{}
      assert task.due_date == ~N[2024-02-12 13:27:00]
      assert task.name == "some updated name"
      assert task.priority == "some updated priority"
      assert task.size == "some updated size"
    end

    test "update_task/2 with invalid data returns error changeset" do
      task = task_fixture()
      assert {:error, %Ecto.Changeset{}} = Tasks.update_task(task, @invalid_attrs)
      assert task == Tasks.get_task!(task.id)
    end

    test "delete_task/1 deletes the task" do
      task = task_fixture()
      assert {:ok, %Task{}} = Tasks.delete_task(task)
      assert_raise Ecto.NoResultsError, fn -> Tasks.get_task!(task.id) end
    end

    test "change_task/1 returns a task changeset" do
      task = task_fixture()
      assert %Ecto.Changeset{} = Tasks.change_task(task)
    end
  end
end
