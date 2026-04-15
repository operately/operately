defimpl OperatelyWeb.Api.Serializable, for: Operately.Assignments.Assignment do
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
      description: assignment.description,
      due_date: assignment.due_date,
      due_status: if(assignment.due_status, do: Atom.to_string(assignment.due_status), else: nil),
      due_status_label: assignment.due_status_label
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Assignments.Assignment.Origin do
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

defimpl OperatelyWeb.Api.Serializable, for: Operately.Assignments.Categorizer.AssignmentGroup do
  def serialize(group, level: :essential) do
    %{
      origin: OperatelyWeb.Api.Serializer.serialize(group.origin),
      assignments: OperatelyWeb.Api.Serializer.serialize(group.assignments)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Assignments.Categorizer.AssignmentCategory do
  def serialize(category, level: :essential) do
    %{
      due_soon: OperatelyWeb.Api.Serializer.serialize(category.due_soon),
      needs_review: OperatelyWeb.Api.Serializer.serialize(category.needs_review),
      upcoming: OperatelyWeb.Api.Serializer.serialize(category.upcoming)
    }
  end
end
