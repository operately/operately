defimpl OperatelyWeb.Api.Serializable, for: Operately.Tasks.Reminder do
  def serialize(reminder, level: :essential) do
    %{
      type: reminder.type,
      days: reminder.days,
      date: reminder.date
    }
  end
end
