defmodule OperatelyEmail.Emails.TaskUpdateEmail do
  def send(_person, _activity) do
    raise "Email for TaskUpdate not implemented"
  end

  def buffered_item(_person, _activity) do
    raise "Not implemented"
  end
end
