defmodule Operately.Billing do
  @moduledoc """
  Billing context for company-level subscription management.

  This module is the primary public API for billing operations. All new
  billing commerce is gated by the `OPERATELY_BILLING_ENABLED` instance-level
  environment variable.

  The company-scoped `billing` experimental feature flag controls the later
  rollout phase for member and storage limit enforcement. Companies without
  that flag can purchase and manage subscriptions without limit warnings or
  blocked actions.
  """

  import Ecto.Query, warn: false
  require Logger
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.Inputs
  alias Operately.Billing.LimitBreachAlerting
  alias Operately.Billing.NearLimitAlerting
  alias Operately.Billing.Overview
  alias Operately.Billing.PlanDefinition
  alias Operately.Billing.Plans
  alias Operately.Companies.Company
  alias Operately.People.Person
  alias Operately.Billing.Polar.Operations.CustomerStateSync
  alias Operately.Billing.Polar.ProductMapper
  alias Operately.Billing.ProductCatalogEntry

  def billing_enabled? do
    Application.get_env(:operately, :billing_enabled, false) == true
  end

  def limit_enforcement_enabled_for_company?(%Operately.Companies.Company{} = company) do
    billing_enabled?() && Operately.Companies.has_experimental_feature?(company, "billing")
  end

  def provider_client(opts \\ []) do
    Keyword.get(opts, :client) || Application.get_env(:operately, :billing_polar_client) || Operately.Billing.Polar.Client
  end

  defdelegate active_member_count(company), to: Operately.Billing.Usage
  defdelegate company_storage_bytes(company), to: Operately.Billing.Usage
  defdelegate check_storage_limit(company, requested_delta), to: Operately.Billing.Usage

  def list_alert_recipients(%Company{} = company) do
    alias Operately.Access.{Binding, Context, GroupMembership}

    Repo.all(
      from p in Person,
        join: m in GroupMembership,
        on: m.person_id == p.id,
        join: b in Binding,
        on: b.group_id == m.group_id,
        join: ctx in Context,
        on: ctx.id == b.context_id,
        where: p.company_id == ^company.id,
        where: p.suspended == false and is_nil(p.suspended_at),
        where: ctx.company_id == ^company.id and b.access_level >= ^Binding.admin_access(),
        order_by: [asc: fragment("lower(?)", p.email), asc: p.id],
        distinct: fragment("lower(?)", p.email)
    )
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

  def attach_access_state(%Operately.Companies.Company{} = company) do
    case get_billing_account_by_company(company) do
      nil ->
        company
        |> Map.put(:billing_access_state, :normal)
        |> Map.put(:billing_read_only, false)

      account ->
        company
        |> Map.put(:billing_access_state, account.access_state)
        |> Map.put(:billing_read_only, account.access_state == :read_only)
    end
  end

  def maybe_enqueue_limit_reached_email(%Operately.Companies.Company{} = company, limit_key, previous_usage, opts \\ []) do
    case LimitBreachAlerting.maybe_enqueue_limit_reached_email(company, limit_key, previous_usage, opts) do
      :ok ->
        :ok

      {:error, reason} ->
        Logger.error("Failed to enqueue billing limit reached email for company #{company.id} and #{limit_key}: #{inspect(reason)}")
        :ok
    end
  end

  def maybe_enqueue_near_limit_warning_email(%Operately.Companies.Company{} = company, limit_key, previous_usage, opts \\ []) do
    case NearLimitAlerting.maybe_enqueue_near_limit_warning_email(company, limit_key, previous_usage, opts) do
      :ok ->
        :ok

      {:error, reason} ->
        Logger.error("Failed to enqueue billing near-limit warning email for company #{company.id} and #{limit_key}: #{inspect(reason)}")
        :ok
    end
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
  defdelegate sync_billing_account(company, attrs), to: Operately.Billing.AccountSyncing, as: :run

  @doc """
  Persists a verified Polar webhook event and enqueues async processing.
  """
  defdelegate ingest_polar_webhook(payload, headers), to: Operately.Billing.Polar.Operations.WebhookIngesting, as: :run

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
  # Plan definitions
  #

  def list_plan_definitions do
    Plans.all()
  end

  def list_active_plan_definitions do
    Plans.list_active()
  end

  def list_customer_selectable_plan_definitions do
    Plans.list_customer_selectable()
  end

  def list_self_serve_sellable_plan_definitions do
    Plans.list_self_serve_sellable()
  end

  def get_plan_definition!(id), do: Repo.get!(PlanDefinition, id)

  def get_plan_definition(id) do
    case Repo.get(PlanDefinition, id) do
      nil -> {:error, :not_found}
      plan_definition -> {:ok, plan_definition}
    end
  end

  def create_plan_definition(attrs) do
    %PlanDefinition{}
    |> PlanDefinition.create_changeset(attrs)
    |> Repo.insert()
  end

  def update_plan_definition(%PlanDefinition{} = plan_definition, attrs) do
    plan_definition
    |> PlanDefinition.update_changeset(attrs)
    |> Repo.update()
  end

  def archive_plan_definition(%PlanDefinition{plan_key: "free"}) do
    {:error, :cannot_archive_free_plan}
  end

  def archive_plan_definition(%PlanDefinition{} = plan_definition) do
    update_plan_definition(plan_definition, %{archived_at: DateTime.utc_now()})
  end

  def unarchive_plan_definition(%PlanDefinition{} = plan_definition) do
    update_plan_definition(plan_definition, %{archived_at: nil})
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
    with {:ok, plan_family} <- cast_provider_managed_plan_family(plan_family),
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
    with {:ok, plan_family} <- cast_provider_managed_plan_family(plan_family),
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
  defdelegate create_managed_product(attrs, opts \\ []), to: Operately.Billing.Polar.Operations.ManagedProductCreating, as: :run

  @doc """
  Updates a managed Polar product and syncs the returned provider state locally.
  """
  defdelegate update_managed_product(entry, attrs, opts \\ []), to: Operately.Billing.Polar.Operations.ManagedProductUpdating, as: :run

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

  def get_company_access_state(%Operately.Companies.Company{} = company) do
    %{
      account: get_billing_account_by_company(company),
      member_limit: company_limit_snapshot(company, :member_count),
      storage_limit: company_limit_snapshot(company, :storage_bytes, current_usage: company_storage_bytes(company))
    }
  end

  def promote_expired_access_states(now \\ DateTime.utc_now()) do
    expired_accounts =
      CompanyBillingAccount
      |> where([account], account.access_state in [:payment_grace, :over_limit_grace])
      |> where([account], not is_nil(account.access_state_ends_at) and account.access_state_ends_at <= ^now)
      |> Repo.all()

    Enum.reduce_while(expired_accounts, {:ok, 0}, fn account, {:ok, count} ->
      case update_billing_account(account, %{
             access_state: :read_only,
             access_state_reason: account.access_state_reason,
             access_state_started_at: account.access_state_ends_at,
             access_state_ends_at: nil
           }) do
        {:ok, _account} -> {:cont, {:ok, count + 1}}
        {:error, changeset} -> {:halt, {:error, changeset}}
      end
    end)
  end

  @doc """
  Creates a hosted Polar session for payment-method management.
  """
  defdelegate create_payment_method_session(company, opts \\ []), to: Operately.Billing.Polar.Operations.CustomerSessionCreating, as: :run_payment_method

  @doc """
  Creates a hosted Polar customer-portal session.
  """
  defdelegate create_customer_portal_session(company, opts \\ []), to: Operately.Billing.Polar.Operations.CustomerSessionCreating, as: :run_portal

  @doc """
  Creates a Polar checkout session for a paid plan and stores the target as
  pending local checkout state.
  """
  defdelegate create_checkout_session(company, plan_key, billing_interval, opts \\ []),
    to: Operately.Billing.Polar.Operations.CheckoutSessionCreating,
    as: :run

  defdelegate change_plan(company, plan_key, billing_interval, opts \\ []),
    to: Operately.Billing.Polar.Operations.PlanChanging,
    as: :run

  defp company_limit_snapshot(company, limit_key, opts \\ []) do
    opts = Keyword.put_new(opts, :requested_delta, 0)

    company
    |> EnforceLimits.status(limit_key, opts)
    |> EnforceLimits.public_snapshot()
  end

  defdelegate cancel_subscription(company, opts \\ []),
    to: Operately.Billing.Polar.Operations.SubscriptionCanceling,
    as: :run

  defdelegate reactivate_subscription(company, opts \\ []),
    to: Operately.Billing.Polar.Operations.SubscriptionReactivating,
    as: :run

  defp normalize_provider_product(provider_product) do
    case ProductMapper.normalize_provider_product(provider_product) do
      {:ok, normalized} -> {:ok, normalized.product_attrs}
      :ignore -> {:error, :internal_server_error}
    end
  end

  defp cast_provider_managed_plan_family(plan_family), do: Inputs.cast_provider_managed_plan_key(plan_family)
  defp cast_billing_interval(interval), do: Inputs.cast_billing_interval(interval)
end
