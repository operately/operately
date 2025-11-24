defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.TaskStatus do
  def serialize(task_status, KJlevel: :essential) do
    %{
      id: task_status.id,
      label: task_status.label,
      color: Atom.to_string(task_status.color),
      index: task_status.index,
      value: task_status.value,
      hidden: task_status.hidden
    }
  end
end
