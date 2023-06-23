defmodule Operately.UpdatesFixtures do
  def update_fixture(attrs \\ %{}) do
    {:ok, update} =
      attrs
      |> Enum.into(%{
        type: :status_update,
        content: %{
          "message" => %{},
        },
        updatable_id: Ecto.UUID.generate(),
        updatable_type: :objective,
      })
      |> Operately.Updates.create_update()

    update
  end

  def comment_fixture(attrs \\ %{}) do
    {:ok, comment} =
      attrs
      |> Enum.into(%{
        content: %{},
      })
      |> Operately.Updates.create_comment()

    comment
  end

  def reaction_fixture(attrs \\ %{}) do
    {:ok, reaction} =
      attrs
      |> Enum.into(%{
        entity_id: "7488a646-e31f-11e4-aace-600308960662",
        entity_type: :update,
        reaction_type: :thumbs_up
      })
      |> Operately.Updates.create_reaction()

    reaction
  end
end
