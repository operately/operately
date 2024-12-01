defmodule OperatelyEmail.Emails.EmailActivationCodeEmail do
  alias Operately.People.EmailActivationCode
  import OperatelyEmail.Mailers.NotificationMailer, only: [html: 2, text: 2]

  def send(email_activation_code) do
    formatted_code = EmailActivationCode.format_code(email_activation_code.code)

    email = Bamboo.Email.new_email(
      to: email_activation_code.email,
      from: {"Operately", OperatelyEmail.notification_email_address()},
      subject: "Operately confirmation code: #{formatted_code}",
      html_body: html("email_activation_code", code: formatted_code),
      text_body: text("email_activation_code", code: formatted_code)
    )

    OperatelyEmail.Mailers.BaseMailer.deliver_now(email)
  end

end
