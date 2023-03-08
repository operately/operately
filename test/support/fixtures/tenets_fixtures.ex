defmodule Operately.TenetsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Tenets` context.
  """

  @doc """
  Generate a tenet.
  """
  def tenet_fixture(attrs \\ %{}) do
    {:ok, tenet} =
      attrs
      |> Enum.into(%{
        description: "some description",
        name: "some name"
      })
      |> Operately.Tenets.create_tenet()

    tenet
  end
end
