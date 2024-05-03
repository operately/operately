defmodule Operately.Operations.CommentAdding do
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Activities
  alias Ecto.Multi

  def run(creator, entity_id, entity_type, content) do
    changeset = Comment.changeset(%{
      author_id: creator.id,
      entity_id: entity_id,
      entity_type: String.to_existing_atom(entity_type),
      content: %{"message" => content}
    })

    entity = find_entity(entity_id, entity_type)
    action = find_action(entity)

    Multi.new()
    |> Multi.insert(:comment, changeset)
    |> insert_activity(creator, action, entity)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
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

  def find_entity(entity_id, entity_type) do
    case entity_type do
      "update" -> Operately.Updates.get_update!(entity_id)
      "project_check_in" -> Operately.Projects.get_check_in!(entity_id)
      "comment_thread" -> Operately.Comments.get_thread!(entity_id)
      _ -> raise "Unknown entity type: #{entity_type}"
    end
  end

  def find_action(%Operately.Updates.Update{type: :project_discussion}), do: :discussion_comment_submitted
  def find_action(%Operately.Updates.Update{type: :goal_check_in}), do: :goal_check_in_commented
  def find_action(%Operately.Projects.CheckIn{}), do: :project_check_in_commented
  def find_action(e), do: raise "Unknown entity type #{inspect(e)}"
end
