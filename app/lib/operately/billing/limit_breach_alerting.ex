defmodule Operately.Billing.LimitBreachAlerting do
  require Logger

  alias Operately.Billing
  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.EnforceLimits.LimitStatus
  alias Operately.Billing.LimitBreachAlertEmailWorker
  alias Operately.Companies.Company

  @valid_limit_keys [:member_count]

  def maybe_enqueue_limit_reached_email(%Company{} = company, limit_key, previous_usage, opts \\ []) when limit_key in @valid_limit_keys and is_integer(previous_usage) do
    if Billing.billing_enabled_for_company?(company) do
      status = limit_status(company, limit_key, opts)

      case threshold_crossed?(status, previous_usage) do
        true -> enqueue_email(company.id, status)
        false -> :ok
      end
    else
      :ok
    end
  rescue
    error ->
      Logger.error("""
      Failed to enqueue billing limit reached email for company #{company.id} and #{limit_key}
      #{Exception.format(:error, error, __STACKTRACE__)}
      """)

      {:error, error}
  end

  def recipients(%Company{} = company) do
    Billing.list_alert_recipients(company)
  end

  def limit_status(company, limit_key, opts \\ [])

  def limit_status(%Company{} = company, :member_count, opts) do
    EnforceLimits.status(company, :member_count, Keyword.put_new(opts, :requested_delta, 0))
  end

  def threshold_crossed?(status, previous_usage) when is_integer(previous_usage) do
    status.enforced and not is_nil(status.limit) and previous_usage < status.limit and status.current_usage >= status.limit
  end

  def snapshot(limit_key, current_usage, limit) when limit_key in @valid_limit_keys and is_integer(current_usage) and is_integer(limit) do
    %LimitStatus{
      limit_key: limit_key,
      plan_key: "free",
      current_usage: current_usage,
      requested_delta: 0,
      projected_usage: current_usage,
      limit: limit,
      remaining: max(limit - current_usage, 0),
      near_limit: current_usage >= limit,
      blocked: false,
      enforced: true,
      recommended_upgrade: nil
    }
  end

  defp enqueue_email(company_id, %LimitStatus{} = status) do
    %{
      company_id: company_id,
      limit_key: Atom.to_string(status.limit_key),
      current_usage: status.current_usage,
      limit: status.limit
    }
    |> LimitBreachAlertEmailWorker.new()
    |> Oban.insert()
    |> case do
      {:ok, _job} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end
