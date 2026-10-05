defmodule OperatelyEmail.Emails.ResetPasswordEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]
  import Swoosh.Email
  alias OperatelyWeb.Paths  

  def send(account, token) do
    Operately.I18n.AccountLanguage.with_locale(account, fn ->
      deliver(account, token)
    end)
  end

  defp deliver(account, token) do
    assigns = %{
      reset_url: Paths.to_url("/reset-password?token=#{token}"),
      subject: gettext("Reset password instructions")
    }

    email = new()
    |> to(account.email)
    |> from({"Operately", OperatelyEmail.notification_email_address()})
    |> subject(assigns[:subject])
    |> html_body(html("reset_password", assigns))
    |> text_body(text("reset_password", assigns))

    OperatelyEmail.Mailers.BaseMailer.deliver_now(email)
  end
end
