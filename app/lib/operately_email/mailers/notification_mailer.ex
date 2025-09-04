defmodule OperatelyEmail.Mailers.NotificationMailer do
  defstruct [:company, :to, :from, :subject, :assigns]

  def new(company) do
    %__MODULE__{company: company, assigns: %{}}
  end

  def to(email, person) do
    %{email | to: person.email}
  end

  def assign(email, key, value) do
    %{email | assigns: Map.put(email.assigns, key, value)}
  end

  def subject(email, subject) do
    %{email | subject: subject}
  end

  def from(email, name) do
    %{email | from: {name, OperatelyEmail.notification_email_address()}}
  end

  def render(email, template) do
    unless email.subject, do: raise "You must set a subject before rendering an email"
    unless email.from, do: raise "You must set a from before rendering an email"
    unless email.to, do: raise "You must set a to before rendering an email"

    full_assigns = Map.put(email.assigns, :subject, email.subject)

    swoosh_email = Swoosh.Email.new()
    |> Swoosh.Email.to(email.to)
    |> Swoosh.Email.from(email.from)
    |> Swoosh.Email.subject(email.subject)
    |> Swoosh.Email.html_body(html(template, full_assigns))
    |> Swoosh.Email.text_body(text(template, full_assigns))

    OperatelyEmail.Mailers.BaseMailer.deliver_now(swoosh_email)
  end

  #
  # Utils
  #

  def html(template, assigns) do
    full_assigns = Map.put(assigns, :layout, {OperatelyEmail.Layouts, "activity.html"})

    Phoenix.View.render_to_string(
      OperatelyEmail.Templates, 
      template <> ".html", 
      full_assigns
    )
  end

  def text(template, assigns) do
    Phoenix.View.render_to_string(OperatelyEmail.Templates, template <> ".text", assigns)
  end

end
