defmodule Operately.Operations.CommentAdding do
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Activities
  alias Ecto.Multi

  def run(creator, entity, entity_type, content) do
    changeset = Comment.changeset(%{
      author_id: creator.id,
      entity_id: entity.id,
      entity_type: String.to_existing_atom(entity_type),
      content: %{"message" => content}
    })
    action = find_action(entity)

    Multi.new()
    |> Multi.insert(:comment, changeset)
    |> insert_activity(creator, action, entity)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
    |> case do
      {:ok, comment} ->
        OperatelyWeb.ApiSocket.broadcast!("api:discussion_comments:#{comment.entity_id}")
        {:ok, comment}

      error -> error
    end
  end

  def insert_activity(multi, creator, action = :discussion_comment_submitted, entity) do
    Activities.insert_sync(multi, creator.id, action, fn changes ->
      %{
        company_id: creator.company_id,
        space_id: entity.updatable_id,
        discussion_id: entity.id,
        comment_id: changes.comment.id
      }
    end)
  end

  def insert_activity(multi, creator, action = :goal_check_in_commented, entity) do
    Activities.insert_sync(multi, creator.id, action, fn changes ->
      %{
        company_id: creator.company_id,
        goal_id: entity.updatable_id,
        goal_check_in_id: entity.id,
        comment_id: changes.comment.id
      }
    end)
  end

  def insert_activity(multi, creator, action = :project_check_in_commented, entity) do
    Activities.insert_sync(multi, creator.id, action, fn changes ->
      %{
        company_id: creator.company_id,
        project_id: entity.project_id,
        check_in_id: entity.id,
        comment_id: changes.comment.id
      }
    end)
  end

  def insert_activity(multi, creator, action = :comment_added, %Operately.Comments.CommentThread{} = entity) do
    activity = Operately.Activities.get_activity!(entity.parent_id)

    Activities.insert_sync(multi, creator.id, action, fn changes ->
      fields = %{
        company_id: creator.company_id,
        comment_id: changes.comment.id,
        comment_thread_id: entity.id,
        activity_id: activity.id,
      }

      fields = if activity.content["goal_id"] do
        Map.put(fields, :goal_id, activity.content["goal_id"])
      else
        fields
      end

      fields = if activity.content["project_id"] do
        Map.put(fields, :project_id, activity.content["project_id"])
      else
        fields
      end

      fields = if activity.content["space_id"] do
        Map.put(fields, :space_id, activity.content["space_id"])
      else
        fields
      end

      fields
    end)
  end

  def find_action(%Operately.Updates.Update{type: :project_discussion}), do: :discussion_comment_submitted
  def find_action(%Operately.Updates.Update{type: :goal_check_in}), do: :goal_check_in_commented
  def find_action(%Operately.Projects.CheckIn{}), do: :project_check_in_commented
  def find_action(%Operately.Comments.CommentThread{}), do: :comment_added
  def find_action(e), do: raise "Unknown entity type #{inspect(e)}"
end
