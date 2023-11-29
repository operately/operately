defmodule OperatelyEmail.ProjectMovedEmail do
  def send(person, _activity) do
    if OperatelyEmail.send_email_to_person?(person) do
      raise "Not implemented"
    end
  end
end
