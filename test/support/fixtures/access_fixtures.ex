defmodule Operately.AccessFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Access` context.
  """

  def context_fixture(attrs \\ %{}) do
    {:ok, context} =
      attrs
      |> Enum.into(%{})
      |> Operately.Access.create_context()

    context
  end

  def group_fixture(attrs \\ %{}) do
    {:ok, group} =
      attrs
      |> Enum.into(%{})
      |> Operately.Access.create_group()

    group
  end

  def binding_fixture(attrs \\ %{}) do
    {:ok, binding} =
      attrs
      |> Enum.into(%{
        access_level: Operately.Access.Binding.full_access(),
      })
      |> Operately.Access.create_binding()

    binding
  end

  def group_membership_fixture(attrs \\ %{}) do
    {:ok, group_membership} =
      attrs
      |> Enum.into(%{})
      |> Operately.Access.create_group_membership()

    group_membership
  end
end
