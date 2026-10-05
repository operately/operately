defmodule OperatelyEmail.Emails.BillingLimitReachedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  alias Operately.Billing.EnforceLimits.LimitStatus
  alias Operately.People.Person
  alias OperatelyWeb.Paths
  alias OperatelyEmail.Mailers.NotificationMailer

  def send(recipients, company, status, job \\ nil)
  def send([], _company, _status, _job), do: {:ok, :no_recipients}

  def send(recipients, company, %LimitStatus{} = status, job) do
    OperatelyEmail.Mailers.BillingMailer.deliver(recipients, company, &build(&1, company, status), job)
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
    gettext("%{company_name} has reached its Free plan member limit", company_name: company.name)
  end

  def template_assigns(company, %LimitStatus{} = status, cta_url) do
    %{
      headline: subject(company, status),
      usage_summary: usage_summary(company, status),
      impact_message: impact_message(status),
      cta_label: gettext("Review billing"),
      cta_url: cta_url
    }
  end

  defp recipient_address(%Person{} = person), do: {person.full_name, person.email}
  defp recipient_address(person), do: {Map.get(person, :full_name), Map.get(person, :email)}

  defp format_usage(:member_count, value), do: Integer.to_string(value)

  defp usage_summary(company, %LimitStatus{limit_key: :member_count} = status) do
    gettext("%{company_name} has reached its member limit: %{usage} of %{limit} active members.",
      company_name: company.name,
      usage: format_usage(status.limit_key, status.current_usage),
      limit: format_usage(status.limit_key, status.limit))
  end

  defp impact_message(%LimitStatus{limit_key: :member_count}) do
    gettext("Adding or restoring people is blocked until the plan is upgraded.")
  end
end
