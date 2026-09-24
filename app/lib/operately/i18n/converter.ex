defmodule Operately.I18n.Converter do
  @moduledoc false

  alias Operately.I18n.{Locale, Message, Placeholders, Po}

  @context_separator "|"
  @plural_separator "_"

  def from_pot(content) when is_binary(content) do
    content
    |> Po.parse()
    |> to_i18next("en")
  end

  def from_po(content, locale) when is_binary(content) and is_binary(locale) do
    content
    |> Po.parse()
    |> to_i18next(locale)
  end

  def to_i18next(messages, locale) when is_list(messages) do
    locale = Locale.to_bcp47(locale)

    messages
    |> Enum.flat_map(&entries(&1, locale))
    |> Map.new()
  end

  defp entries(%Message{msgid_plural: nil} = message, locale) do
    key = i18next_key(message)
    value = translated_singular(message, locale)

    [{key, Placeholders.to_i18next(value)}]
  end

  defp entries(%Message{} = message, locale) do
    key = i18next_key(message)

    locale
    |> Locale.plural_forms()
    |> Enum.flat_map(fn {category, index} ->
      value = translated_plural(message, index, locale)

      # Omitting zero would let i18next use a translated singular such as "1 membro".
      value = if category == :zero, do: present_or(value, message.msgid_plural), else: value

      if blank?(value) do
        []
      else
        [{key <> @plural_separator <> Atom.to_string(category), Placeholders.to_i18next(value)}]
      end
    end)
  end

  defp i18next_key(%Message{msgctxt: msgctxt, msgid: msgid}) do
    msgid = Placeholders.to_i18next(msgid)

    case msgctxt do
      value when value in [nil, ""] -> msgid
      context -> msgid <> @context_separator <> context
    end
  end

  defp translated_singular(%Message{msgstr: msgstr, msgid: msgid}, _locale) do
    if blank?(msgstr), do: msgid, else: msgstr
  end

  defp translated_plural(%Message{} = message, 0, "en") do
    Map.get(message.msgstr_plural, 0) |> present_or(message.msgid)
  end

  defp translated_plural(%Message{} = message, index, "en") do
    Map.get(message.msgstr_plural, index) |> present_or(message.msgid_plural || message.msgid)
  end

  # Missing forms must fall through to English resources so i18next applies English plural rules.
  defp translated_plural(%Message{} = message, index, _locale) do
    Map.get(message.msgstr_plural, index)
  end

  defp present_or(value, fallback) do
    if blank?(value), do: fallback, else: value
  end

  defp blank?(nil), do: true
  defp blank?(""), do: true
  defp blank?(_), do: false
end
