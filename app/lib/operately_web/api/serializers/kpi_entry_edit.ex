defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.KpiEntryEdit do
  alias OperatelyWeb.Api.Serializer

  def serialize(edit, level: :essential) do
    %{
      id: OperatelyWeb.Paths.kpi_entry_edit_id(edit),
      previous_value: edit.previous_value,
      previous_period: Serializer.serialize(edit.previous_period),
      edited_by: Serializer.serialize(edit.edited_by),
      inserted_at: Serializer.serialize(edit.inserted_at)
    }
  end
end
