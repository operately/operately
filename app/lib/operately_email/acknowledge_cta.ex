defmodule OperatelyEmail.AcknowledgeCta do
  def build(person, author_id, roles, url, view_text) do
    if should_acknowledge?(person, author_id, roles) do
      {"Acknowledge", url <> "?acknowledge=true"}
    else
      {view_text, url}
    end
  end

  defp should_acknowledge?(person, author_id, roles) do
    person.id != author_id and Enum.any?(roles, &same_person?(&1, person))
  end

  defp same_person?(nil, _person), do: false
  defp same_person?(%{id: id}, person), do: id == person.id
  defp same_person?(id, person) when is_binary(id), do: id == person.id
end
