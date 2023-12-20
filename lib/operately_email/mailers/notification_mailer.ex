defmodule OperatelyEmail.Mailers.NotificationMailer do
  defstruct [:company, :to, :from, :subject, :assigns]

  def new(company) do
    %__MODULE__{company: company, assigns: %{}, from: OperatelyEmail.sender(company)}
  end

  def to(email, person) do
    %{email | to: person.email}
  end

  def assign(email, key, value) do
    %{email | assigns: Map.put(email.assigns, key, value)}
  end

  def subject(email, subject) do
    sender = OperatelyEmail.sender_name(email.company)

    %{email | subject: "#{sender}: #{subject}"}
  end

  def render(email, template) do
    import Bamboo.Email

    full_assigns = Map.put(email.assigns, :subject, email.subject)

    email = new_email(
      to: email.to,
      from: email.from,
      subject: email.subject,
      html_body: OperatelyEmail.Templates.render(template <> ".html", full_assigns),
      text_body: OperatelyEmail.Templates.render(template <> ".html", full_assigns)
    )

    OperatelyEmail.Mailer.deliver_now(email)
  end
end
