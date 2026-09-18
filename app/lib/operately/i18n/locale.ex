defmodule Operately.I18n.Locale do
  @moduledoc false

  # i18next uses CLDR categories, which do not map one-to-one to Gettext indexes.
  # Portuguese `many` (whole millions) and `other` both use msgstr[1].
  # Russian `other` (fractional counts) uses msgstr[2] (`many`).
  @plural_forms %{
    "en" => [one: 0, other: 1],
    "pt-BR" => [one: 0, many: 1, other: 1],
    "ru" => [one: 0, few: 1, many: 2, other: 2],
    "ru-RU" => [one: 0, few: 1, many: 2, other: 2]
  }

  def to_bcp47(locale) when is_binary(locale) do
    locale
    |> String.replace("_", "-")
    |> split_tag()
    |> then(fn {language, region} ->
      language = String.downcase(language)

      case region do
        nil -> language
        region -> language <> "-" <> String.upcase(region)
      end
    end)
  end

  def to_gettext(locale) when is_binary(locale) do
    locale
    |> to_bcp47()
    |> String.replace("-", "_")
  end

  def plural_forms(locale) when is_binary(locale) do
    Map.get(@plural_forms, to_bcp47(locale), one: 0, other: 1)
  end

  defp split_tag(locale) do
    case String.split(locale, "-", parts: 2) do
      [language] -> {language, nil}
      [language, region] -> {language, region}
    end
  end
end
