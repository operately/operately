defmodule Operately.I18n.ElixirExtractorTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.ElixirExtractor
  alias Operately.I18n.Message

  @fixture Path.expand("fixtures/elixir/sample.ex", __DIR__)

  test "extracts gettext, ngettext, pgettext, and npgettext messages" do
    messages = Map.new(ElixirExtractor.extract_file(@fixture), &{Message.key(&1), &1})

    assert %Message{msgid: "Save", msgid_plural: nil, msgctxt: nil} = messages[{"", "Save"}]
    assert %Message{msgid: "Hello %{name}"} = messages[{"", "Hello %{name}"}]
    assert %Message{msgid: "1 task", msgid_plural: "%{count} tasks"} = messages[{"", "1 task"}]
    assert %Message{msgid: "Close", msgctxt: "button"} = messages[{"button", "Close"}]
    assert %Message{msgid: "1 file", msgid_plural: "%{count} files", msgctxt: "inbox"} = messages[{"inbox", "1 file"}]
  end
end
