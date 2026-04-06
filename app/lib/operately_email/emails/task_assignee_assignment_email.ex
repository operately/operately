defmodule OperatelyEmail.Emails.TaskAssigneeAssignmentEmail do
  def send(_person, _activity) do
    raise "Email for TaskAssigneeAssignment not implemented"
  end

  def buffered_item(_person, _activity) do
    raise "Not implemented"
  end
end
