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
  alias Operately.Billing.Overview
  alias Operately.Billing.Polar.CustomerStateSync
  alias Operately.Billing.Polar.ProductMapper
  alias Operately.Billing.ProductCatalogEntry

  @valid_plan_keys CompanyBillingAccount.valid_plan_keys()
  @valid_billing_intervals CompanyBillingAccount.valid_billing_intervals()

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
      suggested_plan_key: plan_key,
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
      pending_plan_key: plan_key,
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
    |> where([e], is_nil(e.archived_at))
    |> Repo.all()
  end

  def get_product!(id), do: Repo.get!(ProductCatalogEntry, id)

  def get_product(id) do
    case Repo.get(ProductCatalogEntry, id) do
      nil -> {:error, :not_found}
      product -> {:ok, product}
    end
  end

  def find_active_product(plan_family, billing_interval) do
    with {:ok, plan_family} <- cast_plan_family(plan_family),
         {:ok, billing_interval} <- cast_billing_interval(billing_interval) do
      ProductCatalogEntry
      |> where([e], e.plan_family == ^plan_family)
      |> where([e], e.billing_interval == ^billing_interval)
      |> where([e], e.active == true)
      |> where([e], is_nil(e.archived_at))
      |> Repo.one()
    else
      _ -> nil
    end
  end

  def get_product_by_polar_product_id(polar_product_id) when is_binary(polar_product_id) do
    ProductCatalogEntry
    |> where([e], e.polar_product_id == ^polar_product_id)
    |> Repo.one()
  end

  def next_product_version(plan_family, billing_interval) do
    with {:ok, plan_family} <- cast_plan_family(plan_family),
         {:ok, billing_interval} <- cast_billing_interval(billing_interval) do
      ProductCatalogEntry
      |> where([e], e.plan_family == ^plan_family)
      |> where([e], e.billing_interval == ^billing_interval)
      |> select([e], max(e.version))
      |> Repo.one()
      |> case do
        nil -> 1
        version -> version + 1
      end
    else
      _ -> 1
    end
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

  @doc """
  Creates a managed Polar product and syncs the returned provider state locally.
  """
  defdelegate create_managed_product(attrs, opts \\ []), to: Operately.Billing.Polar.ManagedProductCreating, as: :run

  @doc """
  Updates a managed Polar product and syncs the returned provider state locally.
  """
  defdelegate update_managed_product(entry, attrs, opts \\ []), to: Operately.Billing.Polar.ManagedProductUpdating, as: :run

  @doc """
  Archives a managed Polar product in Polar and syncs the archived state locally.
  """
  def archive_managed_product(%ProductCatalogEntry{} = entry, opts \\ []) do
    client = provider_client(opts)

    with {:ok, provider_product} <- client.archive_product(entry.polar_product_id),
         {:ok, normalized_product} <- normalize_provider_product(provider_product),
         {:ok, product} <- upsert_product_from_provider(normalized_product) do
      {:ok, product}
    end
  end

  @doc """
  Upserts a local catalog row from normalized provider attrs.

  Existing active mappings are preserved unless the provider product is archived.
  """
  def upsert_product_from_provider(attrs) do
    case get_product_by_polar_product_id(attrs.polar_product_id) do
      nil ->
        attrs
        |> Map.put(:active, false)
        |> create_product()

      entry ->
        attrs
        |> Map.put(:active, if(is_nil(attrs.archived_at), do: entry.active, else: false))
        |> then(&update_product(entry, &1))
    end
  end

  @doc """
  Activates a catalog product for its plan family and interval.

  Any sibling versions are deactivated, and archived products are rejected.
  """
  def set_active_product(entry_id) when is_binary(entry_id) do
    entry = get_product!(entry_id)
    set_active_product(entry)
  end

  def set_active_product(%ProductCatalogEntry{} = entry) do
    if entry.archived_at do
      {:error, :archived}
    else
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

  def refresh_company_billing_state(%Operately.Companies.Company{} = company, opts \\ []) do
    CustomerStateSync.run(company, opts)
  end

  @doc """
  Returns the current billing overview for a company.

  It prefers a live Polar sync and falls back to the last local projection with
  `stale: true` when provider sync fails.
  """
  def get_company_billing_overview(%Operately.Companies.Company{} = company, opts \\ []) do
    account = get_billing_account_by_company(company)
    catalog_products = list_active_products()

    case refresh_company_billing_state(company, opts) do
      {:ok, synced_account} ->
        {:ok, Overview.build(company, synced_account, catalog_products)}

      {:error, _reason} = error ->
        if account do
          {:ok, Overview.build(company, account, catalog_products, stale: true)}
        else
          error
        end
    end
  end

  @doc """
  Creates a hosted Polar session for payment-method management.
  """
  defdelegate create_payment_method_session(company, opts \\ []), to: Operately.Billing.Polar.CustomerSessionCreating, as: :run_payment_method

  @doc """
  Creates a hosted Polar customer-portal session.
  """
  defdelegate create_customer_portal_session(company, opts \\ []), to: Operately.Billing.Polar.CustomerSessionCreating, as: :run_portal

  defp normalize_provider_product(provider_product) do
    case ProductMapper.normalize_provider_product(provider_product) do
      {:ok, product} -> {:ok, product}
      :ignore -> {:error, :internal_server_error}
    end
  end

  defp provider_client(opts) do
    Keyword.get(opts, :client, Operately.Billing.Polar.Client)
  end

  defp cast_plan_family(plan_family) when plan_family in @valid_plan_keys, do: {:ok, plan_family}

  defp cast_plan_family(plan_family) when is_binary(plan_family) do
    case String.downcase(plan_family) do
      "team" -> {:ok, :team}
      "business" -> {:ok, :business}
      _ -> {:error, :invalid_plan_family}
    end
  end

  defp cast_plan_family(_), do: {:error, :invalid_plan_family}

  defp cast_billing_interval(interval) when interval in @valid_billing_intervals, do: {:ok, interval}

  defp cast_billing_interval(interval) when is_binary(interval) do
    case String.downcase(interval) do
      "monthly" -> {:ok, :monthly}
      "yearly" -> {:ok, :yearly}
      _ -> {:error, :invalid_billing_interval}
    end
  end

  defp cast_billing_interval(_), do: {:error, :invalid_billing_interval}
end
