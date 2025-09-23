defimpl OperatelyWeb.Api.Serializable, for: Operately.Assignments.Loader.Assignment do
  def serialize(assignment, level: :essential) do
    %{
      resource_id: assignment.resource_id,
      name: assignment.name,
      due: assignment.due,
      type: Atom.to_string(assignment.type),
      author_id: assignment.author_id,
      author_name: assignment.author_name,
      path: assignment.path
    }
  end
end
