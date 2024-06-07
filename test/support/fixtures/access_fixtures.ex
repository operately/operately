defmodule Operately.AccessFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Access` context.
  """

  @doc """
  Generate a access_context.
  """
  def access_context_fixture(attrs \\ %{}) do
    {:ok, access_context} =
      attrs
      |> Enum.into(%{

      })
      |> Operately.Access.create_access_context()

    access_context
  end

  @doc """
  Generate a access_group.
  """
  def access_group_fixture(attrs \\ %{}) do
    {:ok, access_group} =
      attrs
      |> Enum.into(%{

      })
      |> Operately.Access.create_access_group()

    access_group
  end

  @doc """
  Generate a access_binding.
  """
  def access_binding_fixture(attrs \\ %{}) do
    {:ok, access_binding} =
      attrs
      |> Enum.into(%{
        access_level: :full_access
      })
      |> Operately.Access.create_access_binding()

    access_binding
  end

  @doc """
  Generate a access_group_membership.
  """
  def access_group_membership_fixture(attrs \\ %{}) do
    {:ok, access_group_membership} =
      attrs
      |> Enum.into(%{

      })
      |> Operately.Access.create_access_group_membership()

    access_group_membership
  end
end
