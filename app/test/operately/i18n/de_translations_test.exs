defmodule Operately.I18n.DeTranslationsTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Po

  @backend OperatelyWeb.Gettext

  test "renders glossary terms and German plurals through Gettext" do
    Gettext.with_locale(@backend, "de", fn ->
      for {source, translation} <- [
            {"Space", "Arbeitsbereich"},
            {"Due date", "Fälligkeitsdatum"},
            {"Retrospective", "Rückblick"},
            {"Acknowledge", "Als gelesen bestätigen"},
            {"Start", "Ausgangswert"},
            {"Target", "Zielwert"},
            {"Champion", "Champion"},
            {"Reviewer", "Reviewer"}
          ] do
        assert Gettext.dgettext(@backend, "messages", source) == translation
      end

      for count <- [0, 1, 2, 1_000_000] do
        expected = if count == 1, do: "Du hast 1 neues Update", else: "Du hast #{count} neue Updates"
        assert Gettext.dngettext(@backend, "messages", "You have 1 new update", "You have %{count} new updates", count) == expected
      end

      assert Gettext.dgettext(@backend, "messages", "Not a cataloged message") == "Not a cataloged message"
    end)
  end

  test "every German translation preserves interpolation bindings and rich-text tags" do
    messages = Po.parse_file!(Path.expand("../../../priv/gettext/de/LC_MESSAGES/messages.po", __DIR__))

    for message <- messages do
      forms =
        if message.msgid_plural do
          [{message.msgid, message.msgstr_plural[0]}, {message.msgid_plural, message.msgstr_plural[1]}]
        else
          [{message.msgid, message.msgstr}]
        end

      for {source, translation} <- forms do
        assert is_binary(translation) and translation != "", "Missing translation: #{source}"
        assert tokens(source) == tokens(translation), "Changed placeholders or tags: #{source}"
      end
    end
  end

  defp tokens(text) do
    Regex.scan(~r/%\{[^}]+\}|<\/?[A-Za-z][A-Za-z0-9]*\s*\/?>/, text) |> Enum.sort()
  end
end
