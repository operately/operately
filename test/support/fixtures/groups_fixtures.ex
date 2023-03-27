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
        name: "some name"
      })
      |> Operately.Groups.create_group()

    group
  end

  @doc """
  Generate a member.
  """
  def member_fixture(attrs \\ %{}) do
    {:ok, member} =
      attrs
      |> Enum.into(%{

      })
      |> Operately.Groups.create_member()

    member
  end
end
