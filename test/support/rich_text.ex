defmodule Operately.Support.RichText do
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
