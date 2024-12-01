defmodule OperatelyEmail.Emails.EmailActivationCodeEmail do
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(email_activation_code) do
    formatted_code = format_code(email_activation_code.code)

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

  defp format_code(code) do
    left = String.slice(code, 0, 3)
    right = String.slice(code, 3, 3)

    "#{left}-#{right}"
  end

end
