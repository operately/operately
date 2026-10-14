defmodule Operately.I18n.EffectiveLanguage do
  @moduledoc false

  alias Operately.I18n.{Languages, Locale}
  alias Operately.People.Person

  def resolve(person), do: preferred_language(person) || Languages.default()

  def put_request_locale(person) do
    language = resolve(person)
    Gettext.put_locale(OperatelyWeb.Gettext, Locale.to_gettext(language))
    language
  end

  def with_locale(person, fun) when is_function(fun, 0) do
    locale = person |> resolve() |> Locale.to_gettext()
    Gettext.with_locale(OperatelyWeb.Gettext, locale, fun)
  end

  defp preferred_language(%Person{language: language}) do
    if Languages.supported?(language), do: language, else: nil
  end

  defp preferred_language(_), do: nil
end
