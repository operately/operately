defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectRetrospectiveCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      comment: Serializer.serialize(content["comment"]),
    }
  end
end
