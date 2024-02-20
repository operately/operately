defmodule Operately.TasksFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Tasks` context.
  """

  @doc """
  Generate a task.
  """
  def task_fixture(attrs \\ %{}) do
    {:ok, task} =
      attrs
      |> Enum.into(%{
        description: %{},
        due_date: ~N[2024-02-11 13:27:00],
        name: "some name",
        priority: "some priority",
        size: "some size"
      })
      |> Operately.Tasks.create_task()

    task
  end

  @doc """
  Generate a assignee.
  """
  def assignee_fixture(attrs \\ %{}) do
    {:ok, assignee} =
      attrs
      |> Enum.into(%{

      })
      |> Operately.Tasks.create_assignee()

    assignee
  end
end
