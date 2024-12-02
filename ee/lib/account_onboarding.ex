defmodule OperatelyEE.AccountOnboardingJob do
  use Oban.Worker
  alias Operately.People.Account

  def perform(job) do
    if Application.get_env(:operately, :send_onboarding_emails) == true do
      send_onboarding_email(job.args["account_id"])
    end
  end

  def send_onboarding_email(account_id) do
    with(
      {:ok, account} <- Account.get(:system, id: account_id),
      :ok <- add_to_contact_list(account)
    ) do
      :ok
    end
  end

  @sendgrid_base_url "https://api.sendgrid.com/v3"

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

    case Req.put!(url, headers: headers, json: body) do
      {:ok, res} -> verify_response(res)
      {:error, _} -> {:error, "Failed to add contact to SendGrid list"}
    end
  end

  defp verify_response(%{status: 202}), do: :ok
  defp verify_response(%{status: status}), do: {:error, "Unexpected status code: #{status}"}
end
