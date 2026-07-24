defimpl OperatelyWeb.Api.Serializable, for: Operately.Search.Result do
  alias OperatelyWeb.Paths

  def serialize(result, level: :essential) do
    %{
      id: encode_id(result.id),
      type: result.type,
      title: result.title,
      context: result.context,
      matched_field: result.matched_field,
      snippet: result.snippet,
      navigation_target: serialize_navigation_target(result.navigation_target)
    }
  end

  defp serialize_navigation_target(target) do
    %{
      resource_hub_id: Paths.resource_hub_id(target.resource_hub_id),
      folder_id: encode_optional_id(target[:folder_id]),
      document_id: encode_optional_id(target[:document_id]),
      file_id: encode_optional_id(target[:file_id]),
      link_id: encode_optional_id(target[:link_id])
    }
  end

  defp encode_optional_id(nil), do: nil
  defp encode_optional_id(id), do: encode_id(id)
  defp encode_id(id), do: Operately.ShortUuid.encode!(id)
end
