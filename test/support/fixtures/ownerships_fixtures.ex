defmodule Operately.OwnershipsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Ownerships` context.
  """

  @doc """
  Generate a ownership.
  """
  def ownership_fixture(attrs \\ %{}) do
    {:ok, ownership} =
      attrs
      |> Enum.into(%{
        person_id: "some person_id",
        target: "some target",
        target_type: :objective
      })
      |> Operately.Ownerships.create_ownership()

    ownership
  end
end
