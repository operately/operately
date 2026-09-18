defmodule Operately.I18n.FrontendExtractorTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.FrontendExtractor
  alias Operately.I18n.Message

  @fixture Path.expand("fixtures/frontend/sample.tsx", __DIR__)

  test "extracts literal JSX expressions and ignores dynamic keys" do
    source = ~S"""
    import { Trans } from "react-i18next";
    <>
      <Trans i18nKey="Save" />
      <Trans i18nKey={"Save"} />
      <Trans i18nKey={'Hello {{name}}'} />
      <Trans i18nKey={key} />
    </>
    """

    messages = FrontendExtractor.extract_contents(source, "sample.tsx")

    assert Enum.map(messages, & &1.msgid) == ["Save", "Save", "Hello %{name}"]
    assert Enum.map(messages, & &1.references) == [[{"sample.tsx", 3}], [{"sample.tsx", 4}], [{"sample.tsx", 5}]]
  end

  test "extracts plural context after a count expression with nested calls and commas" do
    source = ~S"""
    import { tn } from "@/i18n";
    tn("1 task", "{{count}} tasks", count, { context: "inbox" });
    tn("1 file", "{{count}} files", Math.max(0, files.filter((file) => file.active).length), {
      interpolation: { escapeValue: false },
      context: "sidebar",
    });
    """

    messages = FrontendExtractor.extract_contents(source, "sample.ts")

    assert Enum.map(messages, &Message.key/1) == [{"inbox", "1 task"}, {"sidebar", "1 file"}]
    assert Enum.map(messages, & &1.msgid_plural) == ["%{count} tasks", "%{count} files"]
  end

  test "ignores translation calls in comments and strings" do
    source = ~S"""
    import { t } from "i18next";
    // t("Removed")
    const example = 't("Example")';
    t("Active");
    """

    assert [%Message{msgid: "Active"}] = FrontendExtractor.extract_contents(source, "sample.ts")
  end

  test "reports invalid frontend syntax instead of silently dropping messages" do
    source = ~s|import { t } from "i18next"; t("Save";|

    assert_raise RuntimeError, ~r/Frontend translation extraction failed: invalid.ts:1:/, fn ->
      FrontendExtractor.extract_contents(source, "invalid.ts")
    end
  end

  test "recognizes imported aliases and decodes escaped literals" do
    source = ~S"""
    import { Trans as Translation, useTranslation as useMessages } from "react-i18next";
    import { tn as plural } from "@/i18n";
    const { t: translate } = useMessages();
    translate("Hello\u0020{{name}}");
    plural("1 task", "{{count}} tasks", count, { context: "inbox" });
    <Translation i18nKey={"Save"}>Save</Translation>;
    """

    messages = Enum.map(FrontendExtractor.extract_contents(source, "sample.tsx"), &Message.key/1)

    assert messages == [{"", "Hello %{name}"}, {"inbox", "1 task"}, {"", "Save"}]
  end

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

  test "extracts calls through an i18next namespace import" do
    source = ~s|import * as i18n from "i18next"; i18n.t("Save");|

    assert [%Message{msgid: "Save"}] = FrontendExtractor.extract_contents(source, "sample.ts")
  end
end
