defmodule Operately.I18n.EsTranslationsTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Po

  @backend OperatelyWeb.Gettext

  test "renders glossary terms and Spanish plurals through Gettext" do
    Gettext.with_locale(@backend, "es", fn ->
      for {source, translation} <- [
            {"Space", "Espacio"},
            {"Due date", "Fecha de vencimiento"},
            {"Retrospective", "Balance final"},
            {"Acknowledge", "Confirmar la lectura"},
            {"Start", "Valor inicial"},
            {"Target", "Valor objetivo"},
            {"Champion", "Responsable"},
            {"Reviewer", "Revisor"}
          ] do
        assert Gettext.dgettext(@backend, "messages", source) == translation
      end

      for count <- [0, 1, 2, 21, 1_000_000] do
        ending = if count == 1, do: "nueva actualización", else: "nuevas actualizaciones"
        assert Gettext.dngettext(@backend, "messages", "You have 1 new update", "You have %{count} new updates", count) == "Tienes #{count} #{ending}"
      end

      assert Gettext.dgettext(@backend, "messages", "Not a cataloged message") == "Not a cataloged message"
    end)
  end

  test "every Spanish translation preserves interpolation bindings and rich-text tags" do
    messages = Po.parse_file!(Path.expand("../../../priv/gettext/es/LC_MESSAGES/messages.po", __DIR__))

    for message <- messages do
      forms =
        if message.msgid_plural do
          # Spanish singular is only used for one; a literal 1 or a count binding is valid.
          [{message.msgid, message.msgstr_plural[0]}, {message.msgid_plural, message.msgstr_plural[1]}]
        else
          [{message.msgid, message.msgstr}]
        end

      for {source, translation} <- forms do
        assert is_binary(translation) and translation != "", "Missing translation: #{source}"
        expected = tokens(source)
        actual = tokens(translation)
        actual = if "%{count}" in expected, do: actual, else: Enum.reject(actual, &(&1 == "%{count}"))
        assert expected == actual, "Changed placeholders or tags: #{source}"
      end
    end
  end

  defp tokens(text) do
    Regex.scan(~r/%\{[^}]+\}|<\/?[A-Za-z][A-Za-z0-9]*\s*\/?>/, text) |> List.flatten() |> Enum.sort()
  end
end
