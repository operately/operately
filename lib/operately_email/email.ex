defmodule OperatelyEmail.Email do
  import Bamboo.Email

  def welcome_email do
    new_email(
      to: "igor@renderedtext.com",
      from: {"Operately (Rendered Text)", "igor@operately.com"},
      subject: "Welcome to Operately!",
      html_body: "<strong>Thanks for joining!</strong>",
      text_body: "Thanks for joining!"
    )
  end
end
