defmodule Operately.Billing.NearLimitAlertEmailWorker do
  use Oban.Worker, queue: :mailer

  require Logger

  alias Operately.Billing.NearLimitAlert
  alias Operately.Billing.NearLimitAlerting
  alias Operately.Companies
  alias OperatelyEmail.Emails.BillingNearLimitWarningEmail

  def perform(%Oban.Job{args: %{"company_id" => company_id, "limit_key" => limit_key, "current_usage" => current_usage, "limit" => limit}}) do
    with {:ok, limit_key} <- NearLimitAlert.parse_limit_key(limit_key),
         {:ok, current_usage} <- parse_integer(current_usage),
         {:ok, limit} <- parse_integer(limit) do
      company = Companies.get_company!(company_id)

      company
      |> NearLimitAlerting.recipients()
      |> BillingNearLimitWarningEmail.send(company, NearLimitAlerting.snapshot(limit_key, current_usage, limit))
      |> case do
        {:ok, _result} -> :ok
        {:error, reason} -> {:error, reason}
      end
    else
      :error -> {:discard, "invalid_job_args"}
    end
  rescue
    Ecto.NoResultsError ->
      {:discard, "company_not_found"}

    error ->
      Logger.error("""
      Failed to send billing near-limit warning email for company #{company_id}
      #{Exception.format(:error, error, __STACKTRACE__)}
      """)

      reraise(error, __STACKTRACE__)
  end

  defp parse_integer(value) when is_integer(value), do: {:ok, value}

  defp parse_integer(value) when is_binary(value) do
    case Integer.parse(value) do
      {parsed, ""} -> {:ok, parsed}
      _ -> :error
    end
  end

  defp parse_integer(_value), do: :error
end
