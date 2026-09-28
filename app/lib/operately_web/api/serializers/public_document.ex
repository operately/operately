defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.PublicDocument do
  def serialize(document, level: _) do
    %{
      name: document.name,
      content: Jason.encode!(document.content),
      published_at: OperatelyWeb.Api.Serializer.serialize(document.published_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(document.updated_at)
    }
  end
end
