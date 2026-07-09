defmodule Operately.Support.Features.UI.RichText do
  alias Operately.People.Person
  alias Operately.Support.Features.UI
  alias Wallaby.{Browser, Query}

  def mention_person_in_rich_text(state, person_or_name) do
    search_text = mention_search_text(person_or_name)
    editor_text = mention_editor_text(person_or_name)
    editor_query = Query.css(".ProseMirror[contenteditable=true]")

    UI.execute("mention_person_in_rich_text", state, fn session ->
      session =
        Browser.find(session, editor_query, fn element ->
          Browser.send_keys(element, ["@", search_text])
        end)

      session = select_mention_option(session, person_or_name, editor_text)

      wait_until_editor_contains_mention(session, editor_query, editor_text)
    end)
  end

  defp mention_search_text(%Person{} = person), do: Person.first_name(person)
  defp mention_search_text(name) when is_binary(name), do: name

  defp mention_editor_text(%Person{} = person), do: Person.first_name(person)
  defp mention_editor_text(name) when is_binary(name), do: name

  defp select_mention_option(session, %Person{} = person, _editor_text) do
    option_query = UI.query(testid: UI.testid(["mention-person", person.full_name]))

    case Wallaby.Browser.retry(fn ->
           case Browser.execute_query(session, option_query) do
             {:ok, _} -> {:ok, session}
             _ -> {:error, :not_yet}
           end
         end) do
      {:ok, session} ->
        Browser.click(session, option_query)

      {:error, _} ->
        raise "Timed out waiting for mention option '#{person.full_name}'"
    end
  end

  defp select_mention_option(session, _name, editor_text) do
    editor_query = Query.css(".ProseMirror[contenteditable=true]")

    case Wallaby.Browser.retry(fn ->
           if Browser.has_text?(session, editor_text), do: {:ok, session}, else: {:error, :not_yet}
         end) do
      {:ok, session} ->
        Browser.find(session, editor_query, fn element ->
          Browser.send_keys(element, [:enter])
        end)

      {:error, _} ->
        raise "Timed out waiting for mention option '#{editor_text}'"
    end
  end

  defp wait_until_editor_contains_mention(session, editor_query, editor_text) do
    case Wallaby.Browser.retry(fn ->
           if Browser.has_text?(session, editor_query, editor_text), do: {:ok, session}, else: {:error, :not_yet}
         end) do
      {:ok, session} -> session
      {:error, _} -> raise "Timed out waiting for mention '#{editor_text}' in rich text editor"
    end
  end
end
