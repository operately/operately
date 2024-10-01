defmodule Operately.Demo.RichText do
  def from_string(string) do
    %{
      type: :doc,
      content: [
        %{
          type: :paragraph,
          content: [
            %{
              type: :text,
              text: string
            }
          ]
        }
      ]
    }
    |> Jason.encode!()
    |> Jason.decode!()
  end
end
