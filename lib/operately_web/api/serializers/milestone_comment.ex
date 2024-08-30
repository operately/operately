defimpl OperatelyWeb.Api.Serializable, for: Operately.Comments.MilestoneComment do
  def serialize(comment, level: :essential) do
    %{
      action: Atom.to_string(comment.action),
      comment: OperatelyWeb.Api.Serializer.serialize(comment.comment),
    }
  end
end
