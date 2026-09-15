defmodule Operately.I18n.FrontendExtractorTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.FrontendExtractor
  alias Operately.I18n.Message

  @fixture Path.expand("fixtures/frontend/sample.tsx", __DIR__)

  test "extracts t, tn, Trans, context, placeholders, and rich text" do
    messages = Map.new(FrontendExtractor.extract_file(@fixture), &{Message.key(&1), &1})

    assert %Message{msgid: "Save"} = messages[{"", "Save"}]
    assert %Message{msgid: "Hello %{name}"} = messages[{"", "Hello %{name}"}]
    assert %Message{msgid: "Close", msgctxt: "button"} = messages[{"button", "Close"}]
    assert %Message{msgid: "1 task", msgid_plural: "%{count} tasks"} = messages[{"", "1 task"}]
    assert %Message{msgid: "Click <link>here</link> to continue"} = messages[{"", "Click <link>here</link> to continue"}]
    assert %Message{msgid: "Only in English"} = messages[{"", "Only in English"}]
  end

  test "skips files that do not import the translation runtime" do
    source = """
    export function label() {
      return t("Not a translation");
    }
    """

    assert FrontendExtractor.extract_contents(source, "assets/js/other.ts") == []
  end
end
