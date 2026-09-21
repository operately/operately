defmodule Operately.I18n.EffectiveLanguage do
  @moduledoc false

  alias Operately.Companies
  alias Operately.Companies.Company
  alias Operately.I18n.{Languages, Locale}
  alias Operately.People.Person

  def resolve(person, company \\ :from_person)
  def resolve(person, :from_person), do: resolve(person, company_of(person))

  def resolve(person, company) do
    if feature_enabled?(company) do
      preferred_language(person) || Languages.default()
    else
      Languages.default()
    end
  end

  def put_request_locale(person, company) do
    language = resolve(person, company)
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

  defp feature_enabled?(%Company{} = company) do
    Companies.has_experimental_feature?(company, Languages.feature_flag())
  end

  defp feature_enabled?(_), do: false

  defp company_of(%Person{company: %Company{} = company}), do: company

  defp company_of(%Person{company: %Ecto.Association.NotLoaded{}} = person) do
    case Operately.Repo.preload(person, :company).company do
      %Company{} = company -> company
      _ -> nil
    end
  end

  defp company_of(_), do: nil
end
