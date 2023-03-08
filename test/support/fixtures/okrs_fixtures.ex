defmodule Operately.OkrsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Okrs` context.
  """

  @doc """
  Generate a objective.
  """
  def objective_fixture(attrs \\ %{}) do
    {:ok, objective} =
      attrs
      |> Enum.into(%{
        description: "some description",
        name: "some name"
      })
      |> Operately.Okrs.create_objective()

    objective
  end
end
