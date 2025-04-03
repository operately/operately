defmodule Operately.Support.RichText do
  def rich_text(mentioned_people: people) do
    mentions = Enum.map(people, fn p ->
      %{
        "content" => [
          %{
            "attrs" => %{
              "id" => OperatelyWeb.Paths.person_id(p),
              "label" => p.full_name
            },
            "type" => "mention"
          },
          %{"text" => " ", "type" => "text"}
        ],
        "type" => "paragraph"
      }
    end)

    %{
      "content" => mentions,
      "type" => "doc"
    }
    |> Jason.encode!()
  end

  def rich_text(text) do
    %{
      type: :doc,
      content: [
        %{
          type: :paragraph,
          content: [
            %{
              type: :text,
              text: text
            }
          ]
        }
      ]
    }
    |> Jason.encode!()
    |> Jason.decode!()
  end

  def rich_text(text, :as_string) do
    rich_text(text) |> Jason.encode!()
  end
end
