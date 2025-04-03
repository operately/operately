defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectContributorAddition do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      person: Serializer.serialize(content["person"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential)
    }
  end
end
