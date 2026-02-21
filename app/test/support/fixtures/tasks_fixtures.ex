defmodule Operately.TasksFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Tasks` context.
  """

  @doc """
  Generate a task.
  """
  def task_fixture(attrs \\ %{}) do
    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()

    {:ok, task} =
      attrs
      |> Enum.into(%{
        description: %{},
        due_date: %{
          date: ~D[2024-02-11],
          date_type: :day,
          value: "2024-02-11"
        },
        name: "some name",
        priority: "some priority",
        size: "some size",
        subscription_list_id: subscription_list.id,
      })
      |> Operately.Tasks.create_task()

    {:ok, _} = Operately.Notifications.update_subscription_list(subscription_list, %{
      parent_type: :project_task,
      parent_id: task.id,
    })

    task
  end

  @doc """
  Generate a assignee.
  """
  def assignee_fixture(attrs \\ %{}) do
    {:ok, assignee} =
      attrs
      |> Enum.into(%{})
      |> Operately.Tasks.create_assignee()

    assignee
  end
end
