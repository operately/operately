defmodule OperatelyEmail.Emails.TaskSizeChangeEmail do
  def send(_person, _activity) do
    raise "Email for TaskSizeChange not implemented"
  end

  def buffered_item(_person, _activity) do
    raise "Not implemented"
  end
end
