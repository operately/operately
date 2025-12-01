defimpl OperatelyWeb.Api.Serializable, for: Operately.Tasks.KanbanState do
  def serialize(%{state: nil}, _opts) do
    %{}
  end

  def serialize(%{state: state}, _opts) when is_map(state) do
    Enum.into(state, %{}, fn {status, ids} ->
      {status, normalize_ids(ids)}
    end)
  end

  defp normalize_ids(nil), do: []
  defp normalize_ids(ids) when is_list(ids), do: ids
end
