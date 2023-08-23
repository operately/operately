defmodule Operately.UpdatesFixtures do
  def update_fixture(attrs \\ %{}) do
    {:ok, update} =
      attrs
      |> Enum.into(%{
        type: :status_update,
        content: %{
          "message" => %{},
          "old_health" => "on_track",
          "new_health" => "on_track"
        },
        updatable_id: Ecto.UUID.generate(),
        updatable_type: :objective,
      })
      |> Operately.Updates.create_update()

    update
  end

  def comment_fixture(update, attrs) do
    attrs =
      attrs
      |> Enum.into(%{
        content: %{},
      })
      
    {:ok, comment} = Operately.Updates.create_comment(update, attrs)

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
