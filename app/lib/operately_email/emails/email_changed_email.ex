defmodule OperatelyEmail.Emails.EmailChangedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import Swoosh.Email
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(old_email, new_email), do: send(old_email, new_email, nil)

  def send(old_email, new_email, account) do
    Operately.I18n.AccountLanguage.with_locale(account, fn ->
      deliver(old_email, new_email)
    end)
  end

  defp deliver(old_email, new_email) do
    assigns = %{new_email: new_email, subject: gettext("Your Operately email has changed")}

    new()
    |> to(old_email)
    |> from({"Operately", OperatelyEmail.notification_email_address()})
    |> subject(assigns.subject)
    |> html_body(html("email_changed", assigns))
    |> text_body(text("email_changed", assigns))
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end
end
