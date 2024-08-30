defimpl OperatelyWeb.Api.Serializable, for: Operately.Updates.Update do
  def serialize(update = %{type: :goal_check_in}, level: :essential) do
    %{
      id: OperatelyWeb.Paths.goal_update_id(update),
    }
  end

  def serialize(update = %{type: :goal_check_in}, level: :full) do
    %{
      id: OperatelyWeb.Paths.goal_update_id(update),
      goal: OperatelyWeb.Api.Serializer.serialize(update.goal),
      message: Jason.encode!(update.content["message"]),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(update.inserted_at),
      author: OperatelyWeb.Api.Serializer.serialize(update.author),
      acknowledged: update.acknowledged,
      acknowledged_at: OperatelyWeb.Api.Serializer.serialize(update.acknowledged_at),
      acknowledging_person: OperatelyWeb.Api.Serializer.serialize(update.acknowledging_person),
      reactions: OperatelyWeb.Api.Serializer.serialize(update.reactions),
      comments_count: Operately.Updates.count_comments(update.id, :update),
      goal_target_updates: update.content["targets"] && Enum.map(update.content["targets"], fn t ->
        %{
          id: t["id"],
          name: t["name"],
          from: t["from"],
          to: t["to"],
          value: t["value"],
          unit: t["unit"],
          previous_value: t["previous_value"],
          index: t["index"],
        }
      end)
    }
  end

  def serialize(update = %{type: :project_discussion}, level: :essential) do
    %{
      id: OperatelyWeb.Paths.discussion_id(update),
      title: update.content["title"],
      body: Jason.encode!(update.content["body"]),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(update.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(update.updated_at),
      author: OperatelyWeb.Api.Serializer.serialize(update.author),
    }
  end

  def serialize(update = %{type: :project_discussion}, level: :full) do
    %{
      id: OperatelyWeb.Paths.discussion_id(update),
      title: update.content["title"],
      body: Jason.encode!(update.content["body"]),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(update.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(update.updated_at),
      author: OperatelyWeb.Api.Serializer.serialize(update.author),
      space: OperatelyWeb.Api.Serializer.serialize(update.space),
      reactions: OperatelyWeb.Api.Serializer.serialize(update.reactions),
      comments: OperatelyWeb.Api.Serializer.serialize(update.comments)
    }
  end
end
