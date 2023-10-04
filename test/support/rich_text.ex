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
              text: message
            }
          ]
        }
      ]
    }
  end
end
