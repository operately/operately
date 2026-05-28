defmodule Operately.Billing.Usage do
  import Ecto.Query, only: [from: 2]

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
end
