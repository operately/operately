defmodule Operately.I18n.Locale do
  @moduledoc false

  @plural_categories %{
    "en" => [:one, :other],
    "pt-BR" => [:one, :other],
    "pt_BR" => [:one, :other],
    "ru" => [:one, :few, :many],
    "ru_RU" => [:one, :few, :many]
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

  def plural_categories(locale) when is_binary(locale) do
    bcp47 = to_bcp47(locale)

    Map.get(@plural_categories, bcp47) ||
      Map.get(@plural_categories, to_gettext(locale)) ||
      [:one, :other]
  end

  defp split_tag(locale) do
    case String.split(locale, "-", parts: 2) do
      [language] -> {language, nil}
      [language, region] -> {language, region}
    end
  end
end
