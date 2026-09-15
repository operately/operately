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

  test "extracts qualified i18n calls without matching other objects" do
    source = """
    import i18n from "@/i18n";
    i18n.t("Save");
    i18n.t("Close", { context: "button" });
    other.t("Not a translation");
    otheri18n.t("Not the runtime");
    """

    messages = Enum.map(FrontendExtractor.extract_contents(source, "sample.ts"), &Message.key/1)

    assert messages == [{"", "Save"}, {"button", "Close"}]
  end

  test "extracts calls through a direct i18next import" do
    source = ~s|import i18n from "i18next"; i18n.t("Save");|

    assert [%Message{msgid: "Save"}] = FrontendExtractor.extract_contents(source, "sample.ts")
  end
end
