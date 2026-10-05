defmodule OperatelyWeb.Api.Queries.GetLanguage do
  @moduledoc """
  Resolves browser language independently of company headers, including when a
  company route cannot load. Anonymous or unavailable contexts use English.
  """

  use TurboConnect.Query

  alias Operately.Companies.Company
  alias Operately.I18n.{AccountLanguage, EffectiveLanguage, Languages}
  alias Operately.People.Person
  alias OperatelyWeb.Api.Helpers

  inputs do
    field? :company_id, :string, null: true
  end

  outputs do
    field :language, :string, null: false
  end

  def call(conn, inputs) do
    {:ok, %{language: resolve(conn.assigns[:current_account], inputs[:company_id])}}
  end

  defp resolve(nil, _), do: Languages.default()
  defp resolve(account, nil), do: AccountLanguage.resolve(account)

  defp resolve(account, company_id) do
    with {:ok, short_id} <- Helpers.decode_company_id(company_id),
         {:ok, company} <- Company.get(:system, short_id: short_id),
         {:ok, person} <- Person.get(:system, account_id: account.id, company_id: company.id, suspended: false),
         nil <- person.suspended_at do
      EffectiveLanguage.resolve(person, company)
    else
      _ -> Languages.default()
    end
  end
end
