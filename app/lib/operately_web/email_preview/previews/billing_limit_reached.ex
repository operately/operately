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
    assigns = BillingLimitReachedEmail.template_assigns(company, status, cta_url)

    company
    |> Mailer.new()
    |> Mailer.from("Operately")
    |> Mailer.to(recipient)
    |> Mailer.subject(BillingLimitReachedEmail.subject(company, status))
    |> assign_all(assigns)
    |> Preview.build("billing_limit_reached")
  end

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

  defp assign_all(email, assigns) do
    Enum.reduce(assigns, email, fn {key, value}, acc ->
      Mailer.assign(acc, key, value)
    end)
  end
end
