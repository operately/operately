defimpl OperatelyWeb.Api.Serializable, for: Operately.Operations.CuratedTemplateInstantiation.Result do
  def serialize(result, _) do
    %{
      resource_type: result.resource_type,
      resource_id: Operately.ShortUuid.encode!(result.resource_id),
      space_id: Operately.ShortUuid.encode!(result.space_id)
    }
  end
end
