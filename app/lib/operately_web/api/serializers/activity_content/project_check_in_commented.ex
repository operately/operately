defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectCheckInCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      check_in: Serializer.serialize(content["check_in"], level: :essential),
      comment: Serializer.serialize(content["comment"], level: :essential)
    }
  end
end
