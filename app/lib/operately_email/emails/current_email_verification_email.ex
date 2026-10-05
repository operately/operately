defmodule OperatelyEmail.Emails.CurrentEmailVerificationEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import Swoosh.Email
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(email, destination, code) do
    Operately.I18n.AccountLanguage.with_locale(email, fn ->
      deliver(email, destination, code)
    end)
  end

  defp deliver(email, destination, code) do
    formatted = String.slice(code, 0, 3) <> "-" <> String.slice(code, 3, 3)
    assigns = %{code: formatted, destination: destination, subject: gettext("Operately current email verification code: %{code}", code: formatted)}

    new()
    |> to(email)
    |> from({"Operately", OperatelyEmail.notification_email_address()})
    |> subject(assigns.subject)
    |> html_body(html("current_email_verification", assigns))
    |> text_body(text("current_email_verification", assigns))
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end
end
