defmodule OperatelyEmail do

  def sender(company), do: {sender_name(company), notification_email_address()}
  def sender_name(company), do: "Operately (#{company.name})"
  def notification_email_address(), do: Application.get_env(:operately, :notification_email)

end
