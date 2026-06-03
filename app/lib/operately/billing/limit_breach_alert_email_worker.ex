defmodule Operately.Billing.LimitBreachAlertEmailWorker do
  use Oban.Worker, queue: :mailer

  require Logger

  alias Operately.Billing.LimitBreachAlerting
  alias OperatelyEmail.Emails.BillingLimitReachedEmail

  def perform(%Oban.Job{args: %{"company_id" => company_id, "limit_key" => limit_key, "current_usage" => current_usage, "limit" => limit}}) do
    with {:ok, limit_key} <- parse_limit_key(limit_key),
         {:ok, current_usage} <- parse_integer(current_usage),
         {:ok, limit} <- parse_integer(limit),
         company when not is_nil(company) <- LimitBreachAlerting.fetch_company(company_id) do
      company
      |> LimitBreachAlerting.recipients()
      |> BillingLimitReachedEmail.send(company, LimitBreachAlerting.snapshot(limit_key, current_usage, limit))
      |> case do
        {:ok, _result} -> :ok
        {:error, reason} -> {:error, reason}
      end
    else
      :error -> {:discard, "invalid_job_args"}
      nil -> {:discard, "company_not_found"}
    end
  rescue
    error ->
      Logger.error("Failed to send billing limit breach email for company #{company_id}: #{Exception.message(error)}")
      {:error, Exception.message(error)}
  end

  defp parse_limit_key(limit_key) when limit_key in ["member_count", :member_count], do: {:ok, :member_count}
  defp parse_limit_key(_limit_key), do: :error

  defp parse_integer(value) when is_integer(value), do: {:ok, value}
  defp parse_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> {:ok, parsed}
      _ -> :error
    end
  end
  defp parse_integer(_value), do: :error
end
