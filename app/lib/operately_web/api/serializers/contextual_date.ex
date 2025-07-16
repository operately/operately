defimpl OperatelyWeb.Api.Serializable, for: Operately.ContextualDates.ContextualDate do
  def serialize(contextual_date, level: :essential) do
    %{
      date_type: contextual_date.date_type,
      value: contextual_date.value,
      date: OperatelyWeb.Api.Serializer.serialize(contextual_date.date)
    }
  end
end
