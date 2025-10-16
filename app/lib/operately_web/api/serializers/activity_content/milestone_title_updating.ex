defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.MilestoneTitleUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      milestone: Serializer.serialize(content["milestone"], level: :essential),
      old_title: Serializer.serialize(content["old_title"], level: :essential),
      new_title: Serializer.serialize(content["new_title"], level: :essential)
    }
  end
end
