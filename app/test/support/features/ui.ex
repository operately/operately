defmodule Operately.Support.Features.UI do
  use ExUnit.CaseTemplate
  require Wallaby.Browser
  alias Wallaby.Query

  alias Wallaby.{Browser, Element}
  alias Operately.People.Person

  def init_ctx(ctx, state \\ %{}) do
    Map.merge(ctx, state)
  end

  defdelegate debug(ctx, params), to: Operately.Support.Features.UI.Debug

  def login_based_on_tag(state) do
    field = state[:login_as]
    if !field, do: raise("No :login_as tag found on the test")

    person = state[field]
    if !person, do: raise("The :login_as tag on the test points to a field that does not exist on the context")

    login_as(state, person)
  end

  def sleep(passthrough_result, msg) when is_binary(msg) do
    IO.puts(msg)
    :timer.sleep(1000)
    passthrough_result
  end

  def sleep(passthrough_result, duration_ms) when is_integer(duration_ms) do
    :timer.sleep(duration_ms)
    passthrough_result
  end

  def log_time(passthrough_result, msg) do
    IO.puts("#{:os.system_time(:millisecond)} - #{msg}")
    passthrough_result
  end

  def new_session(state) do
    execute("new_session", state, fn _ ->
      metadata = Phoenix.Ecto.SQL.Sandbox.metadata_for(Operately.Repo, self())
      {:ok, session} = Wallaby.start_session(metadata: metadata, window_size: [width: 1920, height: 2000])
      session
    end)
  end

  defdelegate logout(state), to: Operately.Support.Features.UI.UserSession
  defdelegate login_as(state, person), to: Operately.Support.Features.UI.UserSession

  def get_account() do
    Operately.People.Account
    |> Operately.Repo.get_by(email: "john@johnson.com")
    |> Operately.Repo.preload(:person)
  end

  def click(state, %Wallaby.Query{} = query) do
    execute("click", state, fn session ->
      session |> Browser.click(query)
    end)
  end

  def click(state, css: css) do
    execute("click", state, fn session ->
      Browser.click(session, Query.css(css))
    end)
  end

  def click(state, opts) do
    {_, opts} = Keyword.pop(opts, :in)
    css_query = compose_css_query(opts)

    execute("click", state, fn session ->
      session |> Browser.click(Query.css(css_query))
    end)
  rescue
    _e in Wallaby.QueryError ->
      raise """
      Failed to click on element with query: #{inspect(opts)}

      Avalable elements with test-id:
      #{list_all_testids(state)}
      """
  end

  defp list_all_testids(state) do
    script = """
      return Array.from(document.querySelectorAll('[data-test-id]')).map(function(e) {
        return e.attributes['data-test-id'].value;
      })
    """

    Browser.execute_script(state[:session], script, fn result ->
      send(self(), {:testids, result})
    end)

    receive do
      {:testids, testids} -> inspect(testids)
    end
  end

  def hover(state, opts) do
    {_, opts} = Keyword.pop(opts, :in)
    css_query = compose_css_query(opts)

    execute("hover", state, fn session ->
      session |> Browser.hover(Query.css(css_query))
    end)
  end

  def send_keys(state, keys) do
    execute("send_keys", state, fn session ->
      session |> Browser.send_keys(keys)
    end)
  end

  def mention_person_in_rich_text(state, person_or_name) do
    name = mention_name(person_or_name)
    query = Query.css(".ProseMirror[contenteditable=true]")

    execute("mention_person_in_rich_text", state, fn session ->
      session
      |> Browser.find(query, fn element ->
        element
        |> Browser.send_keys(["@", name])
        |> sleep(500)
        |> Browser.send_keys([:enter])
      end)
    end)
  end

  defp mention_name(%Person{} = person), do: Person.first_name(person)
  defp mention_name(name) when is_binary(name), do: name

  defp mention_name(value) do
    raise ArgumentError, "Unsupported mention target: #{inspect(value)}"
  end

  def assert_has(state, testid: id) do
    assert_has(state, query(testid: id))
  rescue
    _e in Wallaby.QueryError ->
      raise """
      Failed to find element with test id: #{id}

      Avalable elements with test-id:
      #{list_all_testids(state)}
      """
  end

  def assert_has(state, testid: id, value: val) do
    assert_has(state, Query.css("[data-test-id=\"#{id}\"][value=\"#{val}\"]"))
  rescue
    _e in Wallaby.QueryError ->
      raise """
      Failed to find element with test id: #{id}

      Avalable elements with test-id:
      #{list_all_testids(state)}
      """
  end

  def assert_has(state, opts) when is_list(opts) do
    {_, opts} = Keyword.pop(opts, :in)
    css_query = compose_css_query(opts)

    assert_has(state, Query.css(css_query))
  end

  def assert_has(state, %Wallaby.Query{} = query) do
    execute("assert_has", state, fn session ->
      case Browser.execute_query(session, query) do
        {:ok, _query_result} ->
          session

        error ->
          case error do
            {:error, {:not_found, results}} ->
              query = %Query{query | result: results}
              raise Wallaby.ExpectationNotMetError, Query.ErrorMessage.message(query, :not_found)

            {:error, e} ->
              raise Wallaby.QueryError, Query.ErrorMessage.message(query, e)
          end
      end
    end)
  end

  def click_button(state, text) do
    click_with_retry(state, Query.button(text))
  end

  def click_link(state, text) do
    click_with_retry(state, Query.link(text))
  end

  def click_text(state, text) do
    click_with_retry(state, Query.text(text))
  end

  defp click_with_retry(state, query) do
    click_with_retry(state, query, attempts: [50, 150, 250, 400, 1000])
  end

  defp click_with_retry(state, query, attempts: []) do
    execute("click_with_retry", state, fn session ->
      session |> Browser.click(query)
    end)
  end

  defp click_with_retry(state, query, attempts: [delay | remaining_attempts]) do
    :timer.sleep(delay)

    try do
      execute("click_with_retry", state, fn session ->
        session |> Browser.click(query)
      end)
    rescue
      e in [Wallaby.QueryError, Wallaby.ExpectationNotMetError] ->
        if remaining_attempts != [] do
          click_with_retry(state, query, attempts: remaining_attempts)
        else
          reraise e, __STACKTRACE__
        end
    end
  end

  def fill(ctx, query, with: value) do
    #
    # Why do we need to sleep here?
    #
    # The reason is that the input field is cleared before the React component
    # has a chance to update the value. This is a common problem with React
    # components that use controlled inputs. The sleep gives the component
    # time to update the value before we clear it.
    #
    # 50ms seems to be a good value for this. It's enough time for the component
    # to update the value, but not too long to slow down the tests. We've tried
    # 10ms, but that was too short.
    #
    execute("fill", ctx, fn session ->
      session
      |> sleep(50)
      |> Browser.clear(query)
      |> Browser.fill_in(query, with: value)
    end)
  end

  def fill(ctx, label: label, with: value) do
    fill(ctx, Query.text_field(label), with: value)
  end

  def fill(ctx, placeholder: placeholder, with: value) do
    fill(ctx, Query.css("[placeholder=\"#{placeholder}\"]"), with: value)
  end

  def fill(ctx, testid: id, with: value) do
    fill(ctx, query(testid: id), with: value)
  end

  def fill_text_field(state, testid: id, with: message) do
    fill_text_field(state, testid: id, with: message, submit: false)
  end

  def fill_text_field(state, testid: id, with: message, submit: submit) do
    #
    # Filling a text field is more compolicated than it seems.
    #
    # Usually, we would use the clear to clear the content
    # and then fill it with the new value. However, in some cases.
    #
    # However, when the text field is blurred (which is triggered by the clear),
    # the react component will revert the value to the previous one.
    #
    # So, we need to clear the field. When the field is focused, the carrot
    # is around the middle of the field, so we need to backspace a lot to
    # remove the content on the left side, and then delete a lot to remove
    # the content on the right side.
    #
    # Finally, we click on the body to blur the field.
    #
    execute("fill_text_field", state, fn session ->
      backspaces = Enum.map(1..150, fn _ -> :backspace end)
      deletes = Enum.map(1..150, fn _ -> :delete end)

      keys = backspaces ++ deletes ++ [message]
      final_keys = if submit, do: keys ++ [:enter], else: keys

      session
      |> Browser.click(query(testid: id))
      |> Browser.send_keys(final_keys)
    end)
  end

  def fill_rich_text(state, message) when is_binary(message) do
    query = Query.css(".ProseMirror[contenteditable=true]")

    execute("fill_rich_text", state, fn session ->
      session
      |> Browser.clear(query)
      |> Browser.find(query, fn element ->
        element |> Browser.send_keys(message)
      end)
    end)
  end

  def fill_rich_text(state, testid: id, with: message) when is_binary(message) do
    query = Query.css("[data-test-id=\"#{id}\"] .ProseMirror[contenteditable=true]")

    execute("fill_rich_text", state, fn session ->
      session
      |> Browser.clear(query)
      |> Browser.find(query, fn element ->
        element |> Browser.send_keys(message)
      end)
    end)
  end

  def select_person_in(state, id: id, name: name) do
    execute("select_person_in", state, fn session ->
      Browser.fill_in(session, Query.css("#" <> id), with: name)
    end)
    |> assert_has(testid: testid(["person-option", name]))
    |> sleep(500)
    |> press_enter()
  end

  def select_person_in(state, testid: id, name: name) do
    root_query = Query.css("[data-test-id=\"#{id}\"]")
    input_query = Query.css("input")
    option_query = Query.css("[data-test-id=\"#{testid(["person-option", name])}\"]")

    execute("select_person_in", state, fn session ->
      Browser.find(session, root_query, fn element ->
        element
        |> Browser.fill_in(input_query, with: name)
        |> Browser.click(option_query)
      end)
    end)
  end

  def press_enter(state) do
    execute("press_enter", state, fn session ->
      session |> Browser.send_keys([:enter])
    end)
  end

  def select(state, testid: id, option: option_name) do
    execute("select", state, fn session ->
      session
      |> Browser.click(query(testid: id))
      |> Browser.click(Query.text(option_name))
    end)
  end

  def assert_text(state, text) do
    execute("assert_text", state, fn session ->
      session |> Browser.assert_text(text)
    end)
  end

  def assert_text(state, text, testid: id) do
    execute("assert_text", state, fn session ->
      session
      |> Browser.find(query(testid: id), fn element ->
        element |> Browser.assert_text(text)
      end)
    end)
  end

  def refute_has(state, %Wallaby.Query{} = query) do
    execute("refute_has", state, fn session ->
      case Browser.execute_query(session, query) do
        {:error, :invalid_selector} -> raise Wallaby.QueryError, Query.ErrorMessage.message(query, :invalid_selector)
        {:error, _not_found} -> session
        {:ok, query} -> raise Wallaby.ExpectationNotMetError, Query.ErrorMessage.message(query, :found)
      end
    end)
  end

  def refute_has(state, opts) do
    {_, opts} = Keyword.pop(opts, :in)
    css_query = compose_css_query(opts)

    refute_has(state, Query.css(css_query), attempts: [1, 50, 150, 250, 400, 1000])
  end

  defp refute_has(state, query, attempts: [delay | attempts]) do
    execute("refute_has", state, fn session ->
      :timer.sleep(delay)

      has_element = session |> Browser.has?(query)

      cond do
        not has_element -> session
        attempts == [] -> raise "Element matching '#{query}' was found on the page"
        true -> refute_has(state, query, attempts: attempts).session
      end
    end)
  end

  def refute_text(state, text) do
    refute_text(state, text, attempts: [50, 150, 250, 400, 1000])
  end

  def refute_text(state, text, testid: id) do
    refute_text(state, text, testid: id, attempts: [50, 150, 250, 400, 1000])
  end

  def refute_text(state, text, testid: id, attempts: [delay | attempts]) do
    execute("refute_text", state, fn session ->
      :timer.sleep(delay)

      session
      |> Browser.find(query(testid: id), fn element ->
        visible_text = element |> Element.text()
        text_found = String.contains?(visible_text, text)

        cond do
          not text_found -> element
          attempts == [] -> raise "Text '#{text}' was found on the page"
          true -> refute_text(state, text, testid: id, attempts: attempts)
        end
      end)
    end)
  end

  def refute_text(state, text, attempts: [delay | attempts]) do
    execute("refute_text", state, fn session ->
      :timer.sleep(delay)

      visible_text = session |> Browser.text()
      text_found = String.contains?(visible_text, text)

      cond do
        not text_found -> session
        attempts == [] -> raise "Text '#{text}' was found on the page"
        true -> refute_text(state, text, attempts: attempts).session
      end
    end)
  end

  def assert_page(state, path) do
    execute("assert_page", state, fn session ->
      require ExUnit.Assertions

      wait_for_page_to_load(state, path)

      ExUnit.Assertions.assert(Browser.current_path(session) == path)

      session
    end)
  end

  def visit(state, path) do
    execute("visit", state, fn session ->
      session |> Browser.visit(path)
    end)
  end

  def scroll_to(state, testid: id) do
    execute("scrollto", state, fn session ->
      session |> Browser.execute_script("document.querySelector('[data-test-id=#{id}]').scrollIntoView()")
    end)
  end

  def find(state, testid: id) do
    execute("find", state, fn session ->
      session |> Browser.find(query(testid: id))
    end)
  end

  def find(state, %Wallaby.Query{} = query) do
    execute("find", state, fn session ->
      session |> Browser.find(query)
    end)
  end

  def find(state, [testid: id], callback) do
    execute("find", state, fn session ->
      session
      |> Browser.find(query(testid: id), fn element ->
        callback.(%{state | session: element})
      end)
    end)
  end

  def find(state, %Wallaby.Query{} = query, callback) do
    execute("find", state, fn session ->
      session
      |> Browser.find(query, fn element ->
        callback.(%{state | session: element})
      end)
    end)
  end

  def query(testid: id) do
    Query.css("[data-test-id=\"#{id}\"]")
  end

  def wait_for_page_to_load(state, path) do
    execute("wait_for_page_load", state, fn session ->
      Wallaby.Browser.retry(fn ->
        if Wallaby.Browser.current_path(session) == path do
          {:ok, session}
        else
          {:error, :not_yet}
        end
      end)

      session
    end)
  end

  alias Operately.Support.Features.UI.Emails, as: Emails

  def list_sent_emails(_state) do
    Emails.list_sent_emails()
  end

  def assert_email_sent(state, title, to: to) do
    Emails.assert_email_sent(title, to)
    state
  end

  def refute_email_sent(state, title, to: to) do
    Emails.refute_email_sent(title, to)
    state
  end

  def upload_file(state, testid: id, path: path) do
    query = Query.css("[data-test-id=\"#{id}\"]", visible: false)

    execute("upload_file", state, fn session ->
      session |> Browser.attach_file(query, path: path)
    end)
  end

  defp execute(action, state, callback) do
    if state[:trace] do
      start_time = System.monotonic_time(:microsecond)
      result = Map.update!(state, :session, callback)
      end_time = System.monotonic_time(:microsecond)

      diff = ((end_time - start_time) / 1000) |> round()
      duration = String.pad_leading(to_string(diff), 6, " ") <> " ms"
      IO.puts("      -> #{duration} - #{action}")
      result
    else
      Map.update!(state, :session, callback)
    end
  end

  defp compose_css_query([]), do: ""

  defp compose_css_query([p | rest]) do
    case p do
      {:title, title} -> "[title=\"#{title}\"]" <> compose_css_query(rest)
      {:alt, alt} -> "[alt=\"#{alt}\"]" <> compose_css_query(rest)
      {:testid, id} -> "[data-test-id=\"#{id}\"]" <> compose_css_query(rest)
      {:css, css} -> css
      _ -> raise "Unknown pattern #{inspect(p)}"
    end
  end

  def take_screenshot(state) do
    execute("take_screenshot", state, fn session ->
      session |> Browser.take_screenshot()
    end)
  end

  def assert_feed_item(ctx, author, title) do
    Operately.Support.Features.FeedSteps.assert_feed_item_exists(ctx, %{author: author, title: title})
  end

  def assert_feed_item(ctx, author, title, content) do
    Operately.Support.Features.FeedSteps.assert_feed_item_exists(ctx, %{
      author: author,
      title: title,
      subtitle: content
    })
  end

  def testid(parts) when is_list(parts) do
    parts
    |> Enum.map(&testid/1)
    |> Enum.join("-")
  end

  def testid(str) do
    str
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9]/, "-")
  end

  def foreach(ctx, list, cb) do
    Enum.reduce(list, ctx, fn item, ctx ->
      cb.(item, ctx)
    end)
  end

  def select_day_in_datepicker(ctx, testid: testid, date: date) do
    is_current_month = date.month == Date.utc_today().month
    is_last_month = date.month == get_last_month()
    is_next_month = date.month == get_next_month()

    day =
      if date.day < 10 do
        "00#{date.day}"
      else
        "0#{date.day}"
      end

    ctx
    |> click(testid: testid)
    |> then(fn ctx ->
      cond do
        is_current_month ->
          ctx
          |> click(css: ".react-datepicker__day.react-datepicker__day--#{day}:not(.react-datepicker__day--disabled)")

        is_last_month ->
          ctx
          |> click(css: ".react-datepicker__navigation.react-datepicker__navigation--prev")
          |> click(css: ".react-datepicker__day.react-datepicker__day--#{day}")

        is_next_month ->
          ctx
          |> click(css: ".react-datepicker__navigation.react-datepicker__navigation--next")
          |> click(css: ".react-datepicker__day.react-datepicker__day--#{day}:not(.react-datepicker__day--disabled)")
      end
    end)
  end

  def select_day_in_date_field(ctx, testid: testid, date: date) do
    is_current_month = date.month == Date.utc_today().month
    is_last_month = date.month == get_last_month()
    is_next_month = date.month == get_next_month()

    # Format the day
    day_number = date.day

    ctx
    |> click(testid: testid)
    |> then(fn ctx ->
      cond do
        is_current_month ->
          ctx
          |> click(testid: "date-field-day-#{day_number}")

        is_last_month ->
          ctx
          |> click(css: "[data-testid='date-field-prev-month']")
          |> click(testid: "date-field-day-#{day_number}")

        is_next_month ->
          ctx
          |> click(css: "[data-testid='date-field-next-month']")
          |> click(testid: "date-field-day-#{day_number}")

        true ->
          # For dates more than one month away, we need additional navigation
          ctx
          |> navigate_to_month(date)
          |> click(css: "[data-testid='date-field-day-#{day_number}']:not([disabled])")
      end
      |> click(testid: "date-field-confirm")
    end)
  end

  def clear_date_in_date_field(ctx, testid: testid) do
    ctx
    |> click(testid: testid)
    |> click(testid: "#{testid}-clear")
  end

  defp navigate_to_month(ctx, date) do
    target_month = date.month
    target_year = date.year

    # Limit to prevent infinite loops
    max_iterations = 24
    navigate_to_month_recursive(ctx, target_month, target_year, max_iterations)
  end

  defp navigate_to_month_recursive(ctx, _target_month, _target_year, 0), do: ctx

  defp navigate_to_month_recursive(ctx, target_month, target_year, iterations_left) do
    current_date = Date.utc_today()
    current_month = current_date.month
    current_year = current_date.year

    is_future = target_year > current_year || (target_year == current_year && target_month > current_month)

    updated_ctx =
      if is_future do
        click(ctx, testid: "date-field-next-month")
      else
        click(ctx, testid: "date-field-prev-month")
      end

    navigate_to_month_recursive(updated_ctx, target_month, target_year, iterations_left - 1)
  end

  def select_date(ctx, testid: testid, date: date) do
    ctx = assert_has(ctx, testid: testid)

    execute("select_date", ctx, fn session ->
      Browser.execute_script(session, "window.__tests.components['#{testid}'].setDate(new Date('#{Date.to_iso8601(date)}'))")
    end)
  end

  def get_all_cookies(state) do
    Browser.cookies(state.session)
  end

  defp get_next_month do
    case Date.utc_today().month + 1 do
      13 -> 1
      month -> month
    end
  end

  defp get_last_month do
    case Date.utc_today().month - 1 do
      0 -> 12
      month -> month
    end
  end
end
