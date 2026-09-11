defmodule OperatelyEmail.Emails.CurrentEmailVerificationEmail do
  import Swoosh.Email
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(email, destination, code) do
    formatted = String.slice(code, 0, 3) <> "-" <> String.slice(code, 3, 3)
    assigns = %{code: formatted, destination: destination, subject: "Operately current email verification code: #{formatted}"}

    new()
    |> to(email)
    |> from({"Operately", OperatelyEmail.notification_email_address()})
    |> subject(assigns.subject)
    |> html_body(html("current_email_verification", assigns))
    |> text_body(text("current_email_verification", assigns))
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end
end
