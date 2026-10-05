defmodule OperatelyEmail.Emails.EmailChangeCodeEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import Swoosh.Email
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(email, code, account \\ nil) do
    Operately.I18n.AccountLanguage.with_locale(account || email, fn ->
      deliver(email, code)
    end)
  end

  defp deliver(email, code) do
    formatted = String.slice(code, 0, 3) <> "-" <> String.slice(code, 3, 3)
    assigns = %{code: formatted, subject: gettext("Operately email change code: %{code}", code: formatted)}

    new()
    |> to(email)
    |> from({"Operately", OperatelyEmail.notification_email_address()})
    |> subject(assigns.subject)
    |> html_body(html("email_change_code", assigns))
    |> text_body(text("email_change_code", assigns))
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end
end
