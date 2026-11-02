defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubDocumentInlineThreadResolutionChanged do
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      document: ResourceHubActivity.serialize_resource(content, "document"),
      inline_thread_id: Operately.ShortUuid.encode!(content["inline_thread_id"]),
      resolved: content["resolved"]
    })
  end
end
