defmodule Operately.Billing.Overview do
  def __api_typename__, do: "billing_overview"

  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.Plans
  alias Operately.Billing.Usage
  alias Operately.Companies.Company

  @enforce_keys [:account, :plans, :catalog_products, :member_count, :storage_usage_bytes, :stale]
  defstruct [:account, :plans, :catalog_products, :member_count, :storage_usage_bytes, :stale]

  def build(%Company{} = company, %CompanyBillingAccount{} = account, catalog_products, opts \\ []) do
    %__MODULE__{
      account: account,
      plans: Plans.all(),
      catalog_products: catalog_products,
      member_count: Usage.active_member_count(company),
      storage_usage_bytes: Usage.company_storage_bytes(company),
      stale: Keyword.get(opts, :stale, false)
    }
  end
end
