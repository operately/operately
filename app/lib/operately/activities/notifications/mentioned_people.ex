defmodule Operately.Activities.Notifications.MentionedPeople do
  alias Operately.RichContent

  def ids(content) when is_binary(content) do
    case Jason.decode(content) do
      {:ok, decoded} -> ids(decoded)
      {:error, _} -> []
    end
  end

  def ids(content) do
    RichContent.find_mentioned_ids(content, :decode_ids)
  rescue
    _ -> []
  end

  def only_current_mentions(person_ids, content) do
    mentioned_ids = MapSet.new(ids(content))

    person_ids
    |> Enum.filter(&MapSet.member?(mentioned_ids, &1))
  end
end
