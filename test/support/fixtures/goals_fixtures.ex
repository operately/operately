defmodule Operately.GoalsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Goals` context.
  """

  @doc """
  Generate a goal.
  """
  def goal_fixture(attrs \\ %{}) do
    {:ok, goal} =
      attrs
      |> Enum.into(%{
        name: "some name"
      })
      |> Operately.Goals.create_goal()

    goal
  end
end
