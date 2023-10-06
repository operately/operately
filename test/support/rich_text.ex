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
end
