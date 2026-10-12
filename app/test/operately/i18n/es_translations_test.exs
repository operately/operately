defmodule Operately.I18n.EsTranslationsTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.{Converter, Po}

  @catalog Path.expand("../../../priv/gettext/es/LC_MESSAGES/messages.po", __DIR__)
  @backend OperatelyWeb.Gettext

  test "Spanish catalog preserves named placeholders and rich-text tags in every form" do
    for message <- Po.parse_file!(@catalog) do
      forms = if message.msgid_plural, do: message.msgstr_plural, else: %{0 => message.msgstr}

      for {index, translation} <- forms do
        source = if index == 0, do: message.msgid, else: message.msgid_plural
        assert tokens(translation, ~r/%\{[^}]+\}/) == tokens(source, ~r/%\{[^}]+\}/), message.msgid
        assert tokens(translation, ~r/<\/?[^>]+>/) == tokens(source, ~r/<\/?[^>]+>/), message.msgid
      end
    end
  end

  test "Spanish uses glossary terms and preserves user content at the backend boundary" do
    Gettext.with_locale(@backend, "es", fn ->
      assert Gettext.dgettext(@backend, "messages", "Home") == "Inicio"
      assert Gettext.dgettext(@backend, "messages", "Champion") == "Responsable"
      assert Gettext.dgettext(@backend, "messages", "Reviewer") == "Revisor"
      assert Gettext.dgettext(@backend, "messages", "Title in Company") == "Cargo"
      assert Gettext.dgettext(@backend, "messages", "Docs & Files") == "Documentos y archivos"
      assert Gettext.dgettext(@backend, "messages", "%{author} added the task \"%{taskName}\"", author: "A <literal>", taskName: "English title") ==
               "A <literal> agregó la tarea «English title»"
    end)
  end

  test "generated Spanish resources match the original catalog" do
    content = File.read!(@catalog)
    resources = File.read!(Path.expand("../../../assets/js/generated/locales/es.json", __DIR__)) |> Jason.decode!()
    assert resources == Converter.from_po(content, "es")
  end

  defp tokens(text, pattern), do: Regex.scan(pattern, text) |> List.flatten() |> Enum.frequencies()
end
