defmodule Operately.Billing.Usage do
  import Ecto.Query, only: [from: 2]

  alias Operately.Blobs.Blob
  alias Operately.Billing.EnforceLimits
  alias Operately.People.Person
  alias Operately.Repo

  def active_member_count(%Operately.Companies.Company{} = company) do
    Repo.aggregate(
      from(p in Person,
        where: p.company_id == ^company.id and p.suspended == false and is_nil(p.suspended_at) and p.type != :ai
      ),
      :count,
      :id
    )
  end

  def check_member_limit(%Operately.Companies.Company{} = company) do
    EnforceLimits.check(company, :member_count, requested_delta: 1)
  end

  def company_storage_bytes(%Operately.Companies.Company{} = company) do
    from(b in Blob,
      where: b.company_id == ^company.id and b.purpose == :company_file and b.status == :uploaded
    )
    |> Repo.aggregate(:sum, :size)
    |> normalize_aggregate_sum()
  end

  def check_storage_limit(%Operately.Companies.Company{} = company, requested_delta) do
    EnforceLimits.check(company, :storage_bytes,
      current_usage: company_storage_bytes(company),
      requested_delta: requested_delta
    )
  end

  defp normalize_aggregate_sum(nil), do: 0
  defp normalize_aggregate_sum(%Decimal{} = value), do: Decimal.to_integer(value)
  defp normalize_aggregate_sum(value) when is_integer(value), do: value
end
