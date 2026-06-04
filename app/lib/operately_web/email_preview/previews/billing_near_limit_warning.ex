defmodule OperatelyWeb.EmailPreview.Previews.BillingNearLimitWarning do
  @moduledoc "Mock data for the billing near-limit warning email preview."

  alias Operately.Billing.NearLimitAlerting
  alias OperatelyEmail.Emails.BillingNearLimitWarningEmail
  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview

  def member_limit do
    build_preview(NearLimitAlerting.snapshot(:member_count, 18, 20))
  end

  def storage_limit do
    build_preview(NearLimitAlerting.snapshot(:storage_bytes, 966_367_642, 1_073_741_824))
  end

  defp build_preview(status) do
    company = %{name: "Acme Corporation"}
    recipient = %{full_name: "Taylor Reed", email: "taylor@localhost.com"}
    cta_url = OperatelyWeb.Paths.to_url("#")

    company
    |> Mailer.new()
    |> Mailer.from("Operately")
    |> Mailer.to(recipient)
    |> Mailer.subject(BillingNearLimitWarningEmail.subject(company, status))
    |> Mailer.assign(:company, company)
    |> Mailer.assign(:limit_name, BillingNearLimitWarningEmail.limit_name(status.limit_key))
    |> Mailer.assign(:current_usage, BillingNearLimitWarningEmail.format_usage(status.limit_key, status.current_usage))
    |> Mailer.assign(:limit, BillingNearLimitWarningEmail.format_usage(status.limit_key, status.limit))
    |> Mailer.assign(:blocked_work, BillingNearLimitWarningEmail.blocked_work(status.limit_key))
    |> Mailer.assign(:cta_url, cta_url)
    |> Preview.build("billing_near_limit_warning")
  end
end
