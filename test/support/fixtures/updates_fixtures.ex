defmodule Operately.UpdatesFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Updates` context.
  """

  @doc """
  Generate a update.
  """
  def update_fixture(attrs \\ %{}) do
    {:ok, update} =
      attrs
      |> Enum.into(%{
        content: "some content",
        updatable_id: "7488a646-e31f-11e4-aace-600308960662",
        updatable_type: :objective
      })
      |> Operately.Updates.create_update()

    update
  end
end
