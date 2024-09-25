defmodule Operately.Operations.CommentAdding.Activity do
  alias Operately.Activities

  def insert(multi, creator, action = :discussion_comment_submitted, entity) do
    Activities.insert_sync(multi, creator.id, action, fn changes ->
      %{
        company_id: creator.company_id,
        space_id: entity.space_id,
        discussion_id: entity.id,
        comment_id: changes.comment.id
      }
    end)
  end

  def insert(multi, creator, action = :goal_check_in_commented, entity) do
    Activities.insert_sync(multi, creator.id, action, fn changes ->
      %{
        company_id: creator.company_id,
        goal_id: entity.goal_id,
        goal_check_in_id: entity.id,
        comment_id: changes.comment.id
      }
    end)
  end

  def insert(multi, creator, action = :project_check_in_commented, entity) do
    Activities.insert_sync(multi, creator.id, action, fn changes ->
      %{
        company_id: creator.company_id,
        project_id: entity.project_id,
        check_in_id: entity.id,
        comment_id: changes.comment.id
      }
    end)
  end

  def insert(multi, creator, action = :project_retrospective_commented, entity) do
    Activities.insert_sync(multi, creator.id, action, fn changes ->
      %{
        company_id: creator.company_id,
        project_id: entity.project_id,
        retrospective_id: entity.id,
        comment_id: changes.comment.id,
      }
    end)
  end

  def insert(multi, creator, action = :comment_added, %Operately.Comments.CommentThread{} = entity) do
    activity = Operately.Activities.get_activity!(entity.parent_id)

    Activities.insert_sync(multi, creator.id, action, fn changes ->
      fields = %{
        company_id: creator.company_id,
        comment_id: changes.comment.id,
        comment_thread_id: entity.id,
        activity_id: activity.id
      }

      fields =
        if activity.content["goal_id"] do
          Map.put(fields, :goal_id, activity.content["goal_id"])
        else
          fields
        end

      fields =
        if activity.content["project_id"] do
          Map.put(fields, :project_id, activity.content["project_id"])
        else
          fields
        end

      fields =
        if activity.content["space_id"] do
          Map.put(fields, :space_id, activity.content["space_id"])
        else
          fields
        end

      fields
    end)
  end
end
