defmodule Operately.GroupsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Groups` context.
  """

  @doc """
  Generate a group.
  """
  def group_fixture(creator, attrs \\ %{}) do
    attrs = attrs
      |> Enum.into(%{
        name: "some name",
        mission: "some mission"
      })

    {:ok, group} = Operately.Groups.create_group(creator, attrs)

    group
  end
end
