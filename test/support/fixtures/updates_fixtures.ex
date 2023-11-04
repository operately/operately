defmodule Operately.UpdatesFixtures do
  def update_health_fixture() do
    %{
      "status" => %{
        "value" => "on_track",
        "comment" => "{}"
      },
      "schedule" => %{
        "value" => "on_schedule",
        "comment" => "{}"
      },
      "budget" => %{
        "value" => "within_budget",
        "comment" => "{}"
      },
      "team" => %{
        "value" => "staffed",
        "comment" => "{}"
      },
      "risks" => %{
        "value" => "no_known_risks",
        "comment" => "{}"
      }
    }
  end

  def update_fixture(attrs \\ %{}) do
    {:ok, update} =
      attrs
      |> Enum.into(%{
        type: :status_update,
        content: %{
          "message" => %{},
          "health" => update_health_fixture(),
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

  def rich_text_fixture(message) do
    Operately.Support.RichText.rich_text(message)
  end
end
