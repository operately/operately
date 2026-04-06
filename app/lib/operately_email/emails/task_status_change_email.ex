defmodule OperatelyEmail.Emails.TaskStatusChangeEmail do
  def send(_person, _activity) do
    raise "Email for TaskStatusChange not implemented"
  end

  def buffered_item(_person, _activity) do
    raise "Not implemented"
  end
end
