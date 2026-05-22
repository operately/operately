defmodule Operately.Billing.Overview do
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.Plans
  alias Operately.Companies.Company

  @enforce_keys [:account, :plans, :catalog_products, :member_count, :stale]
  defstruct [:account, :plans, :catalog_products, :member_count, :stale]

  def build(%Company{} = company, %CompanyBillingAccount{} = account, catalog_products, opts \\ []) do
    %__MODULE__{
      account: account,
      plans: Plans.all(),
      catalog_products: catalog_products,
      member_count: [company] |> Company.load_member_count() |> hd() |> Map.get(:member_count, 0),
      stale: Keyword.get(opts, :stale, false)
    }
  end
end
