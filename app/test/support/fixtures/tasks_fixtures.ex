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

    {:ok, _} =
      Operately.Notifications.update_subscription_list(subscription_list, %{
        parent_type: task_subscription_parent_type(task),
        parent_id: task.id
      })

    task
  end

  defp task_subscription_parent_type(%Operately.Tasks.Task{space_id: space_id}) when not is_nil(space_id), do: :space_task
  defp task_subscription_parent_type(%Operately.Tasks.Task{}), do: :project_task

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
