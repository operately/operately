defmodule OperatelyEmail.Mailers.BaseMailer do
  def deliver_now(email) do
    Operately.Mailer.deliver(email)
  end
end
