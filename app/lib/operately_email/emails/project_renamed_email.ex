defmodule OperatelyEmail.Emails.ProjectRenamedEmail do
  def send(_person, _activity) do
    raise "Not supported"
  end

  def buffered_item(_person, _activity) do
    raise "Not implemented"
  end
end
