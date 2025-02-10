defmodule OperatelyEE.CompanyCreationNotificationJob do
  use Oban.Worker

  alias Operately.People.Account
  alias Operately.Companies.Company

  require Logger

  def perform(job) do
    if send_notification?() do
      send_notification(job.args["company_id"], job.args["account_id"])
    end
  end

  def send_notification? do
    Application.get_env(:operately, :send_company_creation_notifications) == true
  end

  def send_notification(company_id, account_id) do
    with(
      {:ok, company} <- Company.get(:system, id: company_id),
      {:ok, account} <- Account.get(:system, id: account_id),
      :ok <- send_discord_notification(company, account)
    ) do
      :ok
    end
  end

  defp send_discord_notification(company, account) do
    url = Application.get_env(:operately, :company_creation_notification_webhook_url)
    headers = [{"Content-Type", "application/json"}]
    company_url = "#{OperatelyWeb.Endpoint.url()}/admin/companies/#{OperatelyWeb.Paths.company_id(company)}"
    body = %{content: "#{account.full_name} (#{account.email}) has added a new company: [#{company.name}](<#{company_url}>)"}

    case Req.post!(url, headers: headers, json: body) do
      {:ok, res} -> verify_response(res)
      e -> Logger.error("Failed to send company creation notification, error: #{inspect(e)}")
    end
  end

  defp verify_response(%{status: 204}), do: :ok
  defp verify_response(%{status: status}), do: {:error, "Unexpected status code: #{status}"}
end
