defmodule Operately.GroupsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Groups` context.
  """

  @doc """
  Generate a group.
  """
  def group_fixture(attrs \\ %{}) do
    {:ok, group} =
      attrs
      |> Enum.into(%{
        name: "some name",
        mission: "some mission"
      })
      |> Operately.Groups.create_group()

    group
  end
end
