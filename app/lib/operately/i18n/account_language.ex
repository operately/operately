defmodule Operately.I18n.AccountLanguage do
  @moduledoc """
  Account-level emails and pages have no company context. Use a language only when all active
  memberships resolve to it; new accounts and conflicting preferences use English.
  """

  alias Operately.I18n.{EffectiveLanguage, Languages, Locale}
  alias Operately.People.{Account, Person}

  def resolve(%Account{id: id}) do
    Person.list(:system, account_id: id, suspended: false, opts: [preload: :company])
    |> Enum.reject(&(is_nil(&1.company) or not is_nil(&1.suspended_at)))
    |> Enum.map(&EffectiveLanguage.resolve/1)
    |> Enum.uniq()
    |> case do
      [language] -> language
      _ -> Languages.default()
    end
  end

  def resolve(email) when is_binary(email) do
    case Account.get(:system, email: email) do
      {:ok, account} -> resolve(account)
      {:error, :not_found} -> Languages.default()
    end
  end

  def resolve(nil), do: Languages.default()

  def with_locale(account_or_email, fun) do
    locale = account_or_email |> resolve() |> Locale.to_gettext()
    Gettext.with_locale(OperatelyWeb.Gettext, locale, fun)
  end
end
