defimpl OperatelyWeb.Api.Serializable, for: Operately.Search.Result do
  def serialize(result, level: :essential) do
    %{
      id: encode_id(result.id),
      type: result.type,
      title: result.title,
      context: result.context,
      matched_field: result.matched_field,
      snippet: result.snippet,
      state: result.state,
      navigation_target: serialize_navigation_target(result.navigation_target)
    }
  end

  defp serialize_navigation_target(target) do
    %{
      resource_hub_id: encode_optional_id(target[:resource_hub_id]),
      folder_id: encode_optional_id(target[:folder_id]),
      document_id: encode_optional_id(target[:document_id]),
      file_id: encode_optional_id(target[:file_id]),
      link_id: encode_optional_id(target[:link_id]),
      project_id: encode_optional_id(target[:project_id]),
      goal_id: encode_optional_id(target[:goal_id]),
      discussion_id: encode_optional_id(target[:discussion_id]),
      project_check_in_id: encode_optional_id(target[:project_check_in_id]),
      goal_check_in_id: encode_optional_id(target[:goal_check_in_id]),
      project_retrospective_id: encode_optional_id(target[:project_retrospective_id])
    }
  end

  defp encode_optional_id(nil), do: nil
  defp encode_optional_id(id), do: encode_id(id)
  defp encode_id(id), do: Operately.ShortUuid.encode!(id)
end
