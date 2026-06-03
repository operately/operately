defmodule OperatelyWeb.EmailPreview.Previews.BillingLimitReached do
  @moduledoc "Mock data for the billing limit reached email preview."

  alias OperatelyEmail.Emails.BillingLimitReachedEmail
  alias Operately.Billing.EnforceLimits.LimitStatus
  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview

  def member_limit do
    build_preview(limit_status(:member_count, 20, 20))
  end

  defp build_preview(status) do
    company = %{name: "Acme Corporation"}
    recipient = %{full_name: "Taylor Reed", email: "taylor@localhost.com"}
    cta_url = OperatelyWeb.Paths.to_url("#")

    company
    |> Mailer.new()
    |> Mailer.from("Operately")
    |> Mailer.to(recipient)
    |> Mailer.subject(BillingLimitReachedEmail.subject(company, status))
    |> Mailer.assign(:company, company)
    |> Mailer.assign(:limit_name, limit_name(status.limit_key))
    |> Mailer.assign(:current_usage, format_usage(status.limit_key, status.current_usage))
    |> Mailer.assign(:limit, format_usage(status.limit_key, status.limit))
    |> Mailer.assign(:blocked_work, blocked_work(status.limit_key))
    |> Mailer.assign(:cta_url, cta_url)
    |> Preview.build("billing_limit_reached")
  end

  defp limit_name(:member_count), do: "member limit"
  defp blocked_work(:member_count), do: "Adding or restoring people may already be blocked until the plan is upgraded."

  defp format_usage(:member_count, value), do: Integer.to_string(value)

  defp limit_status(limit_key, current_usage, limit) do
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
end
