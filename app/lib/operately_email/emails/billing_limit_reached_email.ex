defmodule OperatelyEmail.Emails.BillingLimitReachedEmail do
  alias Operately.Billing.EnforceLimits.LimitStatus
  alias Operately.People.Person
  alias OperatelyWeb.Paths
  alias OperatelyEmail.Mailers.BaseMailer
  alias OperatelyEmail.Mailers.NotificationMailer

  def send([], _company, _status), do: {:ok, :no_recipients}

  def send(recipients, company, %LimitStatus{} = status) do
    build(recipients, company, status)
    |> BaseMailer.deliver_now()
  end

  def build(recipients, company, %LimitStatus{} = status) do
    subject = subject(company, status)
    assigns = template_assigns(company, status, Paths.company_billing_path(company) |> Paths.to_url()) |> Map.put(:subject, subject)

    Swoosh.Email.new()
    |> Swoosh.Email.to(Enum.map(recipients, &recipient_address/1))
    |> Swoosh.Email.from(OperatelyEmail.sender(company))
    |> Swoosh.Email.subject(subject)
    |> Swoosh.Email.html_body(NotificationMailer.html("billing_limit_reached", assigns))
    |> Swoosh.Email.text_body(NotificationMailer.text("billing_limit_reached", assigns))
  end

  def subject(company, %LimitStatus{limit_key: :member_count}) do
    "#{company.name} has reached its Free plan member limit"
  end

  def template_assigns(company, %LimitStatus{} = status, cta_url) do
    %{
      headline: subject(company, status),
      usage_summary: usage_summary(company, status),
      impact_message: impact_message(status),
      cta_label: "Review billing",
      cta_url: cta_url
    }
  end

  defp recipient_address(%Person{} = person), do: {person.full_name, person.email}
  defp recipient_address(person), do: {Map.get(person, :full_name), Map.get(person, :email)}

  defp format_usage(:member_count, value), do: Integer.to_string(value)

  defp usage_summary(company, %LimitStatus{limit_key: :member_count} = status) do
    "#{company.name} has reached its member limit: #{format_usage(status.limit_key, status.current_usage)} of #{format_usage(status.limit_key, status.limit)} active members."
  end

  defp impact_message(%LimitStatus{limit_key: :member_count}) do
    "Adding or restoring people is blocked until the plan is upgraded."
  end
end
