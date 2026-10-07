defmodule Operately.I18n.TranslationCheck do
  @moduledoc """
  Checks that every extracted source message has a usable PO translation.

  1. Match active PO entries by source text and context, ignoring obsolete entries.
  2. Report absent entries, fuzzy translations, and blank required forms.
  3. Report incompatible singular/plural entries that need translating again.
  4. Include the language, message/context, source location, and missing form in errors.

  Translations identical to English are allowed. Only the exact technical formatter
  key below is exempt. Wording, placeholders, and rich-text tags are not validated.
  """

  alias Operately.I18n.{Locale, Message}

  # This is an i18next formatter key, not product copy; the app supplies its value.
  @technical_keys [{"", "intlRelativeDateTime"}]

  def validate(messages, content, language) do
    translations =
      content
      |> Expo.PO.parse_string!()
      |> Map.fetch!(:messages)
      |> Enum.reject(& &1.obsolete)
      |> Map.new(&{Expo.Message.key(&1), &1})

    plural_indexes = Locale.plural_forms(language) |> Keyword.values() |> Enum.uniq() |> Enum.sort()

    messages
    |> Enum.reject(&(Message.key(&1) in @technical_keys))
    |> Enum.flat_map(fn message ->
      translation = Map.get(translations, Message.key(message))

      message
      |> missing_forms(translation, plural_indexes)
      |> Enum.map(&"#{language} #{describe(message)}: #{&1}; fill the PO entry and run make gen.i18n")
    end)
  end

  defp missing_forms(_message, nil, _indexes), do: ["missing translation"]

  defp missing_forms(message, translation, indexes) do
    if "fuzzy" in List.flatten(translation.flags) do
      ["fuzzy translation; resolve it and remove the fuzzy flag"]
    else
      check_forms(message, translation, indexes)
    end
  end

  defp check_forms(%Message{msgid_plural: nil}, %Expo.Message.Singular{msgstr: text}, _) do
    require_text(text, "msgstr")
  end

  defp check_forms(%Message{msgid_plural: plural}, %Expo.Message.Plural{} = translation, indexes) when not is_nil(plural) do
    if plural == IO.iodata_to_binary(translation.msgid_plural) do
      Enum.flat_map(indexes, &require_text(Map.get(translation.msgstr, &1, []), "msgstr[#{&1}]"))
    else
      ["plural source changed; translate the current forms"]
    end
  end

  defp check_forms(_, _, _), do: ["singular/plural shape changed; translate the current entry"]

  defp require_text(text, form) do
    if text |> IO.iodata_to_binary() |> String.trim() == "" do
      ["#{form} is blank"]
    else
      []
    end
  end

  defp describe(message) do
    context = if message.msgctxt in [nil, ""], do: "", else: " (context: #{inspect(message.msgctxt)})"

    location =
      case message.references do
        [{file, line} | _] -> " at #{file}:#{line}"
        [] -> ""
      end

    inspect(message.msgid) <> context <> location
  end
end
