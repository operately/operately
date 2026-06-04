defmodule Operately.Billing.NearLimitAlerting do
  require Logger

  alias Ecto.Multi
  alias Operately.Billing
  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.EnforceLimits.LimitStatus
  alias Operately.Billing.NearLimitAlert
  alias Operately.Billing.NearLimitAlertEmailWorker
  alias Operately.Companies.Company
  alias Operately.Repo

  @valid_limit_keys NearLimitAlert.valid_limit_keys()

  def maybe_enqueue_near_limit_warning_email(%Company{} = company, limit_key, previous_usage, opts \\ []) when limit_key in @valid_limit_keys and is_integer(previous_usage) do
    if Billing.billing_enabled_for_company?(company) do
      status = limit_status(company, limit_key, opts)

      case threshold_crossed?(status, previous_usage) do
        true -> insert_alert_and_enqueue(company.id, status)
        false -> :ok
      end
    else
      :ok
    end
  rescue
    error ->
      Logger.error("""
      Failed to enqueue billing near-limit warning email for company #{company.id} and #{limit_key}
      #{Exception.format(:error, error, __STACKTRACE__)}
      """)

      {:error, error}
  end

  def recipients(%Company{} = company), do: Billing.list_alert_recipients(company)

  def limit_status(company, limit_key, opts \\ [])

  def limit_status(%Company{} = company, :member_count, opts) do
    EnforceLimits.status(company, :member_count, Keyword.put_new(opts, :requested_delta, 0))
  end

  def limit_status(%Company{} = company, :storage_bytes, opts) do
    EnforceLimits.status(company, :storage_bytes, Keyword.put_new(opts, :requested_delta, 0))
  end

  def threshold_crossed?(%LimitStatus{} = status, previous_usage) when is_integer(previous_usage) do
    threshold = EnforceLimits.near_limit_threshold(status.limit)

    status.enforced and status.plan_key == :free and previous_usage < threshold and status.current_usage >= threshold
  end

  def snapshot(limit_key, current_usage, limit) when limit_key in @valid_limit_keys and is_integer(current_usage) and is_integer(limit) do
    %LimitStatus{
      limit_key: limit_key,
      plan_key: :free,
      current_usage: current_usage,
      requested_delta: 0,
      projected_usage: current_usage,
      limit: limit,
      remaining: max(limit - current_usage, 0),
      near_limit: true,
      blocked: false,
      enforced: true,
      recommended_upgrade: nil
    }
  end

  defp insert_alert_and_enqueue(company_id, %LimitStatus{} = status) do
    sent_at = DateTime.utc_now() |> DateTime.truncate(:second)
    timestamps = sent_at |> DateTime.to_naive() |> NaiveDateTime.truncate(:second)

    Multi.new()
    |> Multi.run(:alert_inserted, fn repo, _changes ->
      attrs = %{
        company_id: company_id,
        limit_key: status.limit_key,
        sent_at: sent_at,
        inserted_at: timestamps,
        updated_at: timestamps
      }

      # The unique company_id + limit_key index makes this a once-only alert per company and limit type.
      case repo.insert_all(NearLimitAlert, [attrs], on_conflict: :nothing, conflict_target: [:company_id, :limit_key]) do
        {1, _} -> {:ok, true}
        {0, _} -> {:ok, false}
      end
    end)
    |> Multi.merge(fn %{alert_inserted: alert_inserted} ->
      if alert_inserted do
        Multi.new()
        |> Oban.insert(:near_limit_email, NearLimitAlertEmailWorker.new(%{
          company_id: company_id,
          limit_key: Atom.to_string(status.limit_key),
          current_usage: status.current_usage,
          limit: status.limit
        }))
      else
        Multi.new()
      end
    end)
    |> Repo.transaction()
    |> case do
      {:ok, _changes} -> :ok
      {:error, _operation, reason, _changes} -> {:error, reason}
    end
  end
end
