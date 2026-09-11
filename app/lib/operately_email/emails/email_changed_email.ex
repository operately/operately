defmodule OperatelyEmail.Emails.EmailChangedEmail do
  import Swoosh.Email
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(old_email, new_email) do
    assigns = %{new_email: new_email, subject: "Your Operately email has changed"}

    new()
    |> to(old_email)
    |> from({"Operately", OperatelyEmail.notification_email_address()})
    |> subject(assigns.subject)
    |> html_body(html("email_changed", assigns))
    |> text_body(text("email_changed", assigns))
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end
end
