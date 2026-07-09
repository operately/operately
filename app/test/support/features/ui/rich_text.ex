defmodule Operately.Support.Features.UI.RichText do
  alias Operately.People.Person
  alias Operately.Support.Features.UI
  alias Wallaby.{Browser, Element, Query, Session}

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

      wait_until_editor_contains_selected_mention(session, editor_query, search_text, editor_text)
    end)
  end

  defp mention_search_text(%Person{} = person), do: Person.first_name(person)
  defp mention_search_text(name) when is_binary(name), do: name

  defp mention_editor_text(%Person{} = person), do: Person.first_name(person)
  defp mention_editor_text(name) when is_binary(name), do: name

  defp select_mention_option(session, %Person{} = person, _editor_text) do
    option_parent = option_query_parent(session)
    option_query = Query.css("button, [role=\"option\"], [data-test-id^=\"mention-person-\"]", text: person.full_name)
    testid_query = UI.query(testid: UI.testid(["mention-person", person.full_name]))
    editor_query = Query.css(".ProseMirror[contenteditable=true]")

    case wait_for_query(option_parent, option_query, attempts: mention_option_attempts()) do
      :ok ->
        Browser.find(session, editor_query, fn element ->
          Browser.send_keys(element, [:enter])
        end)

      :error ->
        case wait_for_query(option_parent, testid_query, attempts: mention_option_attempts()) do
          :ok ->
            Browser.find(session, editor_query, fn element ->
              Browser.send_keys(element, [:enter])
            end)

          :error ->
            raise "Timed out waiting for mention option '#{person.full_name}'"
        end
    end
  end

  defp select_mention_option(session, _name, editor_text) do
    select_mention_option_by_text(session, editor_text)
  end

  defp select_mention_option_by_text(session, text) do
    editor_query = Query.css(".ProseMirror[contenteditable=true]")
    option_parent = option_query_parent(session)

    case wait_for_text(option_parent, text, attempts: mention_option_attempts()) do
      :ok ->
        Browser.find(session, editor_query, fn element ->
          Browser.send_keys(element, [:enter])
        end)

      :error ->
        raise "Timed out waiting for mention option '#{text}'"
    end
  end

  defp mention_option_attempts, do: [25, 50, 100, 150, 250, 400, 800, 1600, 2400]

  defp wait_for_query(session, query, attempts: []) do
    if Browser.has?(session, query), do: :ok, else: :error
  end

  defp wait_for_query(session, query, attempts: [delay | remaining_attempts]) do
    if Browser.has?(session, query) do
      :ok
    else
      Process.sleep(delay)
      wait_for_query(session, query, attempts: remaining_attempts)
    end
  end

  defp wait_for_text(session, text, attempts: []) do
    if Browser.has_text?(session, text), do: :ok, else: :error
  end

  defp wait_for_text(session, text, attempts: [delay | remaining_attempts]) do
    if Browser.has_text?(session, text) do
      :ok
    else
      Process.sleep(delay)
      wait_for_text(session, text, attempts: remaining_attempts)
    end
  end

  defp option_query_parent(%Element{session_url: session_url, driver: driver}) do
    %Session{url: session_url, session_url: session_url, driver: driver}
  end

  defp option_query_parent(session), do: session

  defp wait_until_editor_contains_selected_mention(session, editor_query, search_text, editor_text) do
    case Wallaby.Browser.retry(fn ->
           has_mention_text = Browser.has_text?(session, editor_query, editor_text)
           still_has_search_text = Browser.has_text?(session, editor_query, "@#{search_text}")

           if has_mention_text and not still_has_search_text, do: {:ok, session}, else: {:error, :not_yet}
         end) do
      {:ok, session} -> session
      {:error, _} -> raise "Timed out waiting for mention '#{editor_text}' in rich text editor"
    end
  end
end
