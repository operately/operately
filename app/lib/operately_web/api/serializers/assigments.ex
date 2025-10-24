defimpl OperatelyWeb.Api.Serializable, for: Operately.Assignments.LoaderV2.Assignment do
  def serialize(assignment, level: :essential) do
    %{
      resource_id: assignment.resource_id,
      name: assignment.name,
      due: assignment.due,
      type: Atom.to_string(assignment.type),
      role: Atom.to_string(assignment.role),
      action_label: assignment.action_label,
      path: assignment.path,
      origin: OperatelyWeb.Api.Serializer.serialize(assignment.origin),
      task_status: if(assignment.task_status, do: Atom.to_string(assignment.task_status), else: nil),
      author_id: assignment.author_id,
      author_name: assignment.author_name,
      description: assignment.description
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Assignments.LoaderV2.AssignmentOrigin do
  def serialize(origin, level: :essential) do
    %{
      id: origin.id,
      name: origin.name,
      type: Atom.to_string(origin.type),
      path: origin.path,
      space_name: origin.space_name,
      due_date: origin.due_date
    }
  end
end
