defmodule Operately.I18n.FrTranslationsTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Po

  @backend OperatelyWeb.Gettext

  test "renders glossary terms and French plurals through Gettext" do
    Gettext.with_locale(@backend, "fr", fn ->
      for {source, translation} <- [
            {"Space", "Espace"},
            {"Due date", "Échéance"},
            {"Retrospective", "Bilan"},
            {"Acknowledge", "Confirmer la lecture"},
            {"Start", "Valeur initiale"},
            {"Target", "Valeur cible"},
            {"Champion", "Responsable"},
            {"Reviewer", "Référent"}
          ] do
        assert Gettext.dgettext(@backend, "messages", source) == translation
      end

      for count <- [0, 1, 2, 21, 1_000_000] do
        ending = if count < 2, do: "nouvelle mise à jour", else: "nouvelles mises à jour"
        assert Gettext.dngettext(@backend, "messages", "You have 1 new update", "You have %{count} new updates", count) == "Vous avez #{count} #{ending}"
      end

      assert Gettext.dgettext(@backend, "messages", "Not a cataloged message") == "Not a cataloged message"
    end)
  end

  test "every French translation preserves interpolation bindings and rich-text tags" do
    messages = Po.parse_file!(Path.expand("../../../priv/gettext/fr/LC_MESSAGES/messages.po", __DIR__))

    for message <- messages do
      forms =
        if message.msgid_plural do
          # French singular includes zero, so both forms must retain the count binding.
          for index <- 0..1, do: {message.msgid_plural, message.msgstr_plural[index]}
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
