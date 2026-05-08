defmodule OperatelyEE.AdminApi.Queries.GetAccounts do
  use TurboConnect.Query

  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.People
  alias Operately.People.Person
  alias Operately.Repo

  inputs do
  end

  outputs do
    field :accounts, list_of(:account)
  end

  def call(_conn, _inputs) do
    accounts = load_accounts()
    {:ok, %{accounts: serialize_accounts(accounts)}}
  end

  defp load_accounts do
    accounts = People.list_accounts()
    account_ids = Enum.map(accounts, & &1.id)

    company_counts = load_company_counts(account_ids)
    owned_company_counts = load_owned_company_counts(account_ids)

    Enum.map(accounts, fn account ->
      %{
        account: account,
        companies_count: Map.get(company_counts, account.id, 0),
        owned_companies_count: Map.get(owned_company_counts, account.id, 0)
      }
    end)
  end

  defp load_company_counts(account_ids) do
    Repo.all(
      from(p in Person,
        where: p.account_id in ^account_ids and p.suspended == false and is_nil(p.suspended_at),
        select: {p.account_id, p.company_id},
        distinct: [p.account_id, p.company_id]
      )
    )
    |> Enum.group_by(fn {account_id, _company_id} -> account_id end, fn {_account_id, company_id} -> company_id end)
    |> Map.new(fn {account_id, company_ids} -> {account_id, length(company_ids)} end)
  end

  defp load_owned_company_counts(account_ids) do
    Repo.all(
      from(p in Person,
        join: m in assoc(p, :access_group_memberships),
        join: g in assoc(m, :group),
        join: b in assoc(g, :bindings),
        join: ctx in assoc(b, :context),
        where: p.account_id in ^account_ids and p.suspended == false and is_nil(p.suspended_at),
        where: ctx.company_id == p.company_id and b.access_level == ^Binding.full_access(),
        select: {p.account_id, p.company_id},
        distinct: [p.account_id, p.company_id]
      )
    )
    |> Enum.group_by(fn {account_id, _company_id} -> account_id end, fn {_account_id, company_id} -> company_id end)
    |> Map.new(fn {account_id, company_ids} -> {account_id, length(company_ids)} end)
  end

  defp serialize_accounts(accounts) do
    Enum.map(accounts, fn data ->
      %{
        id: data.account.id,
        full_name: data.account.full_name,
        email: data.account.email,
        site_admin: data.account.site_admin,
        companies_count: data.companies_count,
        owned_companies_count: data.owned_companies_count,
        inserted_at: OperatelyWeb.Api.Serializer.serialize(data.account.inserted_at, level: :essential)
      }
    end)
  end
end
