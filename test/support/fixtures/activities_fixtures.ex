defmodule Operately.ActivitiesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Activities` context.
  """

  @doc """
  Generate a activity.
  """
  def activity_fixture(attrs \\ %{}) do
    {:ok, activity} =
      attrs
      |> Enum.into(%{
        action_type: "some action_type",
        resource_id: "7488a646-e31f-11e4-aace-600308960662",
        resource_type: "some resource_type"
      })
      |> Operately.Activities.create_activity()

    activity
  end
end
