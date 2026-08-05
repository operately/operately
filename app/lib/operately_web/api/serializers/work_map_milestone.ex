defimpl OperatelyWeb.Api.Serializable, for: Operately.WorkMaps.WorkMapMilestone do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(milestone, level: :essential) do
    %{
      id: Paths.milestone_id(milestone.id, milestone.title),
      title: milestone.title,
      status: to_string(milestone.status),
      timeframe: Serializer.serialize(milestone.timeframe)
    }
  end
end
