defmodule Operately.Support.Features.UI do
  use ExUnit.CaseTemplate
  alias Wallaby.Query

  alias Wallaby.Browser
  require Wallaby.Browser
  import Wallaby.Browser, only: [execute_query: 2]

  def init_ctx(ctx, state \\ %{}) do
    Map.merge(ctx, state)
  end

  def login_based_on_tag(state) do
    field = state[:login_as]
    if !field, do: raise "No :login_as tag found on the test"

    person = state[field]
    if !person, do: raise "The :login_as tag on the test points to a field that does not exist on the context"

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

  def login_as(state, person) do
    path = URI.encode("/accounts/auth/test_login?email=#{person.email}&full_name=#{person.full_name}")

    execute(state, fn session ->
      session
      |> Browser.visit("/")
      |> Browser.set_cookie("_operately_key", "")
      |> Browser.visit(path)
      |> Browser.visit("/")
      |> Browser.assert_text("Company Space") # Ensure we are logged in and that the lobby is loaded
    end)
    |> Map.put(:last_login, person)
  end

  def get_account() do
    Operately.People.Account
    |> Operately.Repo.get_by(email: "john@johnson.com")
    |> Operately.Repo.preload(:person)
  end

  def click(state, %Wallaby.Query{} = query) do
    execute(state, fn session ->
      session |> Browser.click(query)
    end)
  end

  def click(state, opts) do
    {_, opts} = Keyword.pop(opts, :in)
    css_query = compose_css_query(opts)

    execute(state, fn session ->
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

    execute(state, fn session ->
      session |> Browser.hover(Query.css(css_query))
    end)
  end

  def send_keys(state, keys) do 
    execute(state, fn session ->
      session |> Browser.send_keys(keys)
    end)
  end

  def assert_has(state, %Wallaby.Query{} = query) do
    execute(state, fn session ->
      session |> Browser.assert_has(query)
    end)
  end

  def assert_has(state, opts) do
    {_, opts} = Keyword.pop(opts, :in)
    css_query = compose_css_query(opts)

    execute(state, fn session ->
      session |> Browser.assert_has(Query.css(css_query))
    end)
  end

  def click_button(state, text) do
    execute(state, fn session ->
      session |> Browser.click(Query.button(text))
    end)
  end

  def click_link(state, text) do
    execute(state, fn session ->
      session |> Browser.click(Query.link(text))
    end)
  end

  def fill_in(state, query, with: value) do
    execute(state, fn session ->
      session |> Browser.fill_in(query, with: value)
    end)
  end

  def fill(state, label, with: value) when is_binary(label) do
    execute(state, fn session ->
      session |> Browser.fill_in(Query.text_field(label), with: value)
    end)
  end

  def fill(state, placeholder: placeholder, with: value) do
    query = Query.css("[placeholder=\"#{placeholder}\"]")

    execute(state, fn session ->
      session |> Browser.clear(query) |> Browser.fill_in(query, with: value)
    end)
  end

  def fill(state, testid: id, with: value) do
    q = query(testid: id)

    execute(state, fn session ->
      session |> Browser.clear(q) |> Browser.fill_in(q, with: value)
    end)
  end

  def fill_rich_text(state, message) when is_binary(message) do
    execute(state, fn session ->
      session
      |> Browser.find(Query.css(".ProseMirror[contenteditable=true]"), fn element ->
        element |> Browser.send_keys(message)
      end)
    end)
  end

  def fill_rich_text(state, testid: id, with: message) when is_binary(message) do
    execute(state, fn session ->
      session
      |> Browser.find(Query.css("[data-test-id=\"#{id}\"] .ProseMirror[contenteditable=true]"), fn element ->
        element |> Browser.send_keys(message)
      end)
    end)
  end

  def select_person_in(state, id: id, name: name) do
    execute(state, fn session ->
      session
      |> Browser.fill_in(Query.css("#" <> id), with: name)
      |> Browser.assert_text(name)
      |> Browser.send_keys([:enter])
    end)
  end

  def select(state, testid: id, option: option_name) do
    execute(state, fn session ->
      session
      |> Browser.click(Query.css("[data-test-id=\"#{id}\"]"))
      |> Browser.click(Query.text(option_name))
    end)
  end

  def assert_text(state, text) do
    execute(state, fn session ->
      session |> Browser.assert_text(text)
    end)
  end

  def assert_text(state, text, testid: id) do
    execute(state, fn session ->
      session
      |> Browser.find(Query.css("[data-test-id=\"#{id}\"]"), fn element ->
        element |> Browser.assert_text(text)
      end)
    end)
  end

  def refute_has(state, %Wallaby.Query{} = query) do
    execute(state, fn session ->
      session |> Browser.refute_has(query)
    end)
  end

  def refute_has(state, opts) do
    {_, opts} = Keyword.pop(opts, :in)
    css_query = compose_css_query(opts)

    execute(state, fn session ->
      session |> Browser.refute_has(Query.css(css_query))
    end)
  end

  def refute_text(state, text) do
    execute(state, fn session ->
      session |> Browser.refute_has(Query.text(text))
    end)
  end

  def refute_text(state, text, testid: id) do
    execute(state, fn session ->
      session
      |> Browser.find(Query.css("[data-test-id=\"#{id}\"]"), fn element ->
        element |> Browser.refute_has(Query.text(text))
      end)
    end)
  end

  def assert_page(state, path) do
    execute(state, fn session ->
      require ExUnit.Assertions

      wait_for_page_to_load(state, path)

      ExUnit.Assertions.assert Browser.current_path(session) == path

      session
    end)
  end

  def visit(state, path) do
    execute(state, fn session ->
      session |> Browser.visit(path)
    end)
  end

  def scroll_to(state, testid: id) do
    execute(state, fn session ->
      session |> Browser.execute_script("document.querySelector('[data-test-id=#{id}]').scrollIntoView()")
    end)
  end

  def find(state, testid: id) do
    execute(state, fn session ->
      session |> Browser.find(Query.css("[data-test-id=\"#{id}\"]"))
    end)
  end

  def find(state, %Wallaby.Query{} = query, callback) do
    execute(state, fn session ->
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
    execute(state, fn session ->
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

  def list_sent_emails(_state) do
    {:messages, messages} = Process.info(self(), :messages)

    Enum.filter(messages, fn m ->
      case m do
        {:delivered_email, _} -> true
        _ -> false
      end
    end) 
    |> Enum.map(fn {:delivered_email, email} -> email end)
  end

  def assert_email_sent(state, title, to: to) do
    emails = 
      state
      |> list_sent_emails()
      |> Enum.map(fn email -> {email.subject, elem(hd(email.to), 1)} end)

    found = {title, to} in emails

    assert found, """
    Expected email to be sent:
      - Title: #{inspect(title)}
        To: #{inspect(to)}

    Sent emails:
    #{emails |> Enum.map(fn {title, to} -> "  - Title: #{inspect(title)}\n    To: #{inspect(to)}" end) |> Enum.join("\n")}
    """

    state
  end

  def upload_file(state, testid: id, path: path) do
    query = Query.css("[data-test-id=\"#{id}\"]", visible: false)

    execute(state, fn session ->
      session |> Browser.attach_file(query, path: path)
    end)
  end

  def refute_email_sent(state, title, to: to) do
    emails =
      state
      |> list_sent_emails()
      |> Enum.map(fn email -> {email.subject, elem(hd(email.to), 1)} end)

    refute {title, to} in emails
  end

  defp execute(state, callback) do
    Map.update!(state, :session, callback)
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
    execute(state, fn session ->
      session |> Browser.take_screenshot()
    end)
  end
end
