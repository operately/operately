defmodule OperatelyEmail.Emails.BillingNearLimitWarningEmail do
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
    assigns = template_assigns(company, status) |> Map.put(:subject, subject)

    Swoosh.Email.new()
    |> Swoosh.Email.to(Enum.map(recipients, &recipient_address/1))
    |> Swoosh.Email.from(OperatelyEmail.sender(company))
    |> Swoosh.Email.subject(subject)
    |> Swoosh.Email.html_body(NotificationMailer.html("billing_near_limit_warning", assigns))
    |> Swoosh.Email.text_body(NotificationMailer.text("billing_near_limit_warning", assigns))
  end

  def subject(company, %LimitStatus{limit_key: :member_count}) do
    "#{company.name} has reached 90% of its free-plan member limit"
  end

  def subject(company, %LimitStatus{limit_key: :storage_bytes}) do
    "#{company.name} has reached 90% of its free-plan storage limit"
  end

  defp template_assigns(company, %LimitStatus{} = status) do
    %{
      company: company,
      limit_name: limit_name(status.limit_key),
      current_usage: format_usage(status.limit_key, status.current_usage),
      limit: format_usage(status.limit_key, status.limit),
      blocked_work: blocked_work(status.limit_key),
      cta_url: Paths.company_billing_path(company) |> Paths.to_url()
    }
  end

  defp recipient_address(%Person{} = person), do: {person.full_name, person.email}
  defp recipient_address(person), do: {Map.get(person, :full_name), Map.get(person, :email)}

  def limit_name(:member_count), do: "free-plan member limit"
  def limit_name(:storage_bytes), do: "free-plan storage limit"

  def blocked_work(:member_count), do: "Adding or restoring people will be blocked once the free-plan member limit is reached."
  def blocked_work(:storage_bytes), do: "Uploads will be blocked once the free-plan storage limit is reached."

  def format_usage(:member_count, value), do: Integer.to_string(value)
  def format_usage(:storage_bytes, value), do: format_storage_bytes(value)

  defp format_storage_bytes(bytes) when bytes < 1024, do: "#{bytes} B"

  defp format_storage_bytes(bytes) do
    [
      {"TB", 1024 ** 4},
      {"GB", 1024 ** 3},
      {"MB", 1024 ** 2},
      {"KB", 1024}
    ]
    |> Enum.find(fn {_unit, size} -> bytes >= size end)
    |> case do
      {unit, size} ->
        value = Float.round(bytes / size, 1)
        "#{value} #{unit}"

      nil ->
        "#{bytes} B"
    end
  end
end
