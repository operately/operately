defmodule OperatelyEE.AccountOnboardingJob do
  use Oban.Worker
  alias Operately.People.Account

  def perform(job) do
    if Application.get_env(:operately, :send_onboarding_emails) == true do
      send_onboarding_email(job["account_id"])
    end
  end

  defp send_onboarding_email(account_id) do
    with(
      {:ok, account} = Account.get(:system, id: account_id),
      :ok <- add_to_contact_list(account)
    ) do
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

    list_id = Application.get_env(:operately, :sendgrid_saas_onboarding_list_id)
    email = account.email
    first_name = String.split(account.name, " ") |> List.first()
    last_name = String.split(account.name, " ") |> List.last()

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

    Finch.request(:post, url, headers, body)
  end
end
