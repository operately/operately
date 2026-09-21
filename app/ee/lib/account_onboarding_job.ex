defmodule OperatelyEE.AccountOnboardingJob do
  use Oban.Worker
  require Logger

  alias Operately.People.Account

  def perform(job) do
    if Application.get_env(:operately, :send_onboarding_emails) == true do
      send_onboarding_email(job.args["account_id"])
    else
      :ok
    end
  end

  def send_onboarding_email(account_id) do
    with(
      {:ok, account} <- fetch_account(account_id),
      :ok <- add_to_contact_list(account)
    ) do
      :ok
    end
  end

  @sendgrid_base_url "https://api.sendgrid.com/v3"

  defp fetch_account(account_id) do
    case Account.get(:system, id: account_id) do
      {:ok, account} -> {:ok, account}
      {:error, :not_found} -> {:discard, "account_not_found"}
      {:error, reason} -> {:error, reason}
    end
  end

  defp add_to_contact_list(account) do
    api_key = System.get_env("SENDGRID_API_KEY")

    headers = [
      {"Authorization", "Bearer #{api_key}"},
      {"Content-Type", "application/json"}
    ]

    url = "#{@sendgrid_base_url}/marketing/contacts"

    email = account.email
    list_id = Application.get_env(:operately, :sendgrid_saas_onboarding_list_id)
    first_name = String.split(account.full_name, " ") |> List.first()
    last_name = String.split(account.full_name, " ") |> List.last()

    body = %{
      list_ids: [list_id],
      contacts: [
        %{
          email: email,
          first_name: first_name,
          last_name: last_name
        }
      ]
    }

    case Req.put(url, headers: headers, json: body) do
      {:ok, res} -> interpret_sendgrid_response(res)
      {:error, _} -> {:error, "Failed to add contact to SendGrid list"}
    end
  end

  defp interpret_sendgrid_response(%{status: 202}), do: :ok

  defp interpret_sendgrid_response(%{status: status} = response) do
    reason = sendgrid_error(response)

    if retryable_status?(status) do
      {:error, reason}
    else
      Logger.warning("SendGrid rejected onboarding contact upsert: #{reason}")
      {:discard, reason}
    end
  end

  defp retryable_status?(status) when status in [408, 429], do: true
  defp retryable_status?(status) when status >= 500, do: true
  defp retryable_status?(_status), do: false

  defp sendgrid_error(%{status: status, body: body}), do: "Unexpected status code: #{status} (#{inspect(body)})"
  defp sendgrid_error(%{status: status}), do: "Unexpected status code: #{status}"
end
