defmodule OperatelyEmail.ProjectRenamedEmail do
  def send(person, _activity) do
    if OperatelyEmail.send_email_to_person?(person) do
      raise "Not supported"
    end
  end
end
