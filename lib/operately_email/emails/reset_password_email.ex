defmodule OperatelyEmail.Emails.ResetPasswordEmail do
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(account, token) do
    assigns = %{
      code: formatted_code,
      subject: "Operately confirmation code: #{formatted_code}"
    }

    email = Bamboo.Email.new_email(
      to: email_activation_code.email,
      from: {"Operately", OperatelyEmail.notification_email_address()},
      subject: assigns[:subject],
      html_body: html("email_activation_code", assigns),
      text_body: text("email_activation_code", assigns)
    )

    OperatelyEmail.Mailers.BaseMailer.deliver_now(email)
  end

end
