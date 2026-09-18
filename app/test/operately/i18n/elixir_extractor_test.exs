defmodule Operately.I18n.ElixirExtractorTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.ElixirExtractor
  alias Operately.I18n.Message

  @fixture Path.expand("fixtures/elixir/sample.ex", __DIR__)

  test "extracts inline HEEx sigils with original source lines" do
    source = ~S'''
    defmodule Sample do
      def render(assigns) do
        ~H"""
        <div title={gettext("Title")}>
          {pgettext("button", "Close")}
          {ngettext("1 task", "%{count} tasks", @count)}
          <%!-- {gettext("Commented out")} --%>
        </div>
        """
      end

      def label(assigns), do: ~H|<span>{gettext("Label")}</span>|
    end
    '''

    messages = Map.new(ElixirExtractor.extract_contents(source, "sample.ex"), &{Message.key(&1), &1})

    assert map_size(messages) == 4
    assert messages[{"", "Title"}].references == [{"sample.ex", 4}]
    assert messages[{"button", "Close"}].references == [{"sample.ex", 5}]
    assert messages[{"", "1 task"}].msgid_plural == "%{count} tasks"
    assert messages[{"", "Label"}].references == [{"sample.ex", 12}]
  end

  test "extracts HEEx expressions and attributes with source references" do
    source = """
    <div title={gettext("Title")}>
      <%= gettext("Save") %>
      {pgettext("button", "Close")}
      <.button label={ngettext("1 task", "%{count} tasks", @count)} />
      <%!-- {gettext("Commented out")} --%>
    </div>
    """

    messages = Map.new(ElixirExtractor.extract_contents(source, "sample.heex"), &{Message.key(&1), &1})

    assert map_size(messages) == 4
    assert messages[{"", "Title"}].references == [{"sample.heex", 1}]
    assert messages[{"", "Save"}].references == [{"sample.heex", 2}]
    assert messages[{"button", "Close"}].references == [{"sample.heex", 3}]
    assert messages[{"", "1 task"}].msgid_plural == "%{count} tasks"
  end

  test "reports invalid Elixir instead of silently omitting its messages" do
    assert_raise SyntaxError, fn ->
      ElixirExtractor.extract_contents("gettext(\"Save\")\n)", "invalid.ex")
    end
  end

  test "extracts gettext, ngettext, pgettext, and npgettext messages" do
    messages = Map.new(ElixirExtractor.extract_file(@fixture), &{Message.key(&1), &1})

    assert %Message{msgid: "Save", msgid_plural: nil, msgctxt: nil} = messages[{"", "Save"}]
    assert %Message{msgid: "Hello %{name}"} = messages[{"", "Hello %{name}"}]
    assert %Message{msgid: "1 task", msgid_plural: "%{count} tasks"} = messages[{"", "1 task"}]
    assert %Message{msgid: "Close", msgctxt: "button"} = messages[{"button", "Close"}]
    assert %Message{msgid: "1 file", msgid_plural: "%{count} files", msgctxt: "inbox"} = messages[{"inbox", "1 file"}]
  end
end
