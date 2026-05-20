defmodule Operately.Billing do
  @moduledoc """
  Billing context for company-level subscription management.

  This module is the primary public API for billing operations. All new
  billing behavior is gated behind:

  1. The `OPERATELY_BILLING_ENABLED` instance-level environment variable.
  2. The `billing` company-scoped experimental feature flag.

  When either gate is closed, billing behaves as a no-op and companies
  remain on the `free` plan.
  """

  import Ecto.Query, warn: false
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.ProductCatalogEntry

  def billing_enabled? do
    Application.get_env(:operately, :billing_enabled, false)
  end

  def billing_enabled_for_company?(%Operately.Companies.Company{} = company) do
    billing_enabled?() && Operately.Companies.has_experimental_feature?(company, "billing")
  end

  #
  # Billing accounts
  #

  def list_billing_accounts do
    Repo.all(CompanyBillingAccount)
  end

  def get_billing_account!(id), do: Repo.get!(CompanyBillingAccount, id)

  def get_billing_account_by_company(%Operately.Companies.Company{} = company) do
    CompanyBillingAccount
    |> where([a], a.company_id == ^company.id)
    |> Repo.one()
  end

  def get_or_create_billing_account(%Operately.Companies.Company{} = company) do
    case get_billing_account_by_company(company) do
      nil ->
        create_billing_account(%{company_id: company.id, provider: "polar", status: :free})

      account ->
        {:ok, account}
    end
  end

  def create_billing_account(attrs \\ %{}) do
    %CompanyBillingAccount{}
    |> CompanyBillingAccount.changeset(attrs)
    |> Repo.insert()
  end

  def update_billing_account(%CompanyBillingAccount{} = account, attrs) do
    account
    |> CompanyBillingAccount.changeset(attrs)
    |> Repo.update()
  end

  def delete_billing_account(%CompanyBillingAccount{} = account) do
    Repo.delete(account)
  end

  @doc """
  Upserts a billing account with normalized state fetched from Polar.
  Called by webhook processing and manual refresh.
  """
  def sync_billing_account(%Operately.Companies.Company{} = company, attrs) do
    case get_billing_account_by_company(company) do
      nil -> create_billing_account(Map.put(attrs, :company_id, company.id))
      account -> update_billing_account(account, attrs)
    end
  end

  @doc """
  Records a remembered upgrade preference from the website or other sources.
  Does not change plan entitlements.
  """
  def remember_plan(%CompanyBillingAccount{} = account, plan_key, billing_interval, source) do
    update_billing_account(account, %{
      suggested_plan_key: to_string(plan_key),
      suggested_billing_interval: billing_interval,
      suggested_plan_source: source
    })
  end

  @doc """
  Clears any pending checkout state after a successful subscription change.
  """
  def clear_pending_checkout(%CompanyBillingAccount{} = account) do
    update_billing_account(account, %{
      pending_plan_key: nil,
      pending_billing_interval: nil,
      pending_checkout_started_at: nil
    })
  end

  @doc """
  Sets pending checkout state so the billing page can show recovery UI.
  """
  def set_pending_checkout(%CompanyBillingAccount{} = account, plan_key, billing_interval) do
    update_billing_account(account, %{
      pending_plan_key: to_string(plan_key),
      pending_billing_interval: billing_interval,
      pending_checkout_started_at: DateTime.utc_now()
    })
  end

  #
  # Product catalog
  #

  def list_products do
    Repo.all(ProductCatalogEntry)
  end

  def list_active_products do
    ProductCatalogEntry
    |> where([e], e.active == true)
    |> Repo.all()
  end

  def get_product!(id), do: Repo.get!(ProductCatalogEntry, id)

  def find_active_product(plan_family, billing_interval) do
    ProductCatalogEntry
    |> where([e], e.plan_family == ^plan_family)
    |> where([e], e.billing_interval == ^billing_interval)
    |> where([e], e.active == true)
    |> Repo.one()
  end

  def create_product(attrs \\ %{}) do
    %ProductCatalogEntry{}
    |> ProductCatalogEntry.changeset(attrs)
    |> Repo.insert()
  end

  def update_product(%ProductCatalogEntry{} = entry, attrs) do
    entry
    |> ProductCatalogEntry.changeset(attrs)
    |> Repo.update()
  end

  def delete_product(%ProductCatalogEntry{} = entry) do
    Repo.delete(entry)
  end

  def set_active_product(entry_id) when is_binary(entry_id) do
    entry = get_product!(entry_id)
    set_active_product(entry)
  end

  def set_active_product(%ProductCatalogEntry{} = entry) do
    Multi.new()
    |> Multi.update_all(
      :deactivate_others,
      fn _changes ->
        ProductCatalogEntry
        |> where([e], e.provider == ^entry.provider)
        |> where([e], e.plan_family == ^entry.plan_family)
        |> where([e], e.billing_interval == ^entry.billing_interval)
        |> where([e], e.id != ^entry.id)
      end,
      set: [active: false]
    )
    |> Multi.update(:activate, ProductCatalogEntry.changeset(entry, %{active: true}))
    |> Repo.transaction()
    |> case do
      {:ok, %{activate: activated}} -> {:ok, activated}
      {:error, _step, changeset, _changes} -> {:error, changeset}
    end
  end
end
