defimpl OperatelyWeb.Api.Serializable, for: Operately.Tasks.Reminder do
  def serialize(reminder, level: :essential) do
    %{
      type: reminder.type,
      days: reminder.days,
      enabled: reminder.enabled
    }
  end
end
