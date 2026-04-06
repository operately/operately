defmodule OperatelyEmail.Emails.TaskClosingEmail do
  def send(_person, _activity) do
    raise "Email for TaskClosing not implemented"
  end

  def buffered_item(_person, _activity) do
    raise "Not implemented"
  end
end
