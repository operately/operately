defmodule Operately.Operations.SpaceDeleting do
  @moduledoc """
  Handles the deletion of a space and its related entities.

  ## Deletion Process

  Direct associations to the space (i.e. projects, goals, resource hubs, message boards,
  members, access contexts, and access bindings) are automatically cascade deleted
  at the database level.

  Polymorphic associations (i.e. comments, reactions, activities related to deleted entities)
  need to be deleted manually as part of the transaction since they don't have
  direct foreign key constraints to the space table.
  """

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Projects.{Project, CheckIn}
  alias Operately.Goals.{Goal, Update}
  alias Operately.Messages.{Message, MessagesBoard}

  def run(space) do
    Multi.new()
    |> collect_sub_resources(space)
    |> delete_polymorphic_associations()
    |> Multi.delete(:space, space)
    |> Repo.transaction()
    |> Repo.extract_result(:space)
  end

  defp collect_sub_resources(multi, space) do
    import Ecto.Query, only: [from: 2]

    Multi.run(multi, :sub_resources, fn _, _ ->
      # Get all projects in the space
      project_ids = from(p in Project, where: p.group_id == ^space.id, select: p.id) |> Repo.all()

      # Get all goals in the space
      goal_ids = from(g in Goal, where: g.group_id == ^space.id, select: g.id) |> Repo.all()

      # Get all message boards in the space
      message_board_ids = from(mb in MessagesBoard, where: mb.space_id == ^space.id, select: mb.id) |> Repo.all()

      # Get all messages from these message boards
      message_ids = from(m in Message, where: m.messages_board_id in ^message_board_ids, select: m.id) |> Repo.all()

      # Get all project check-ins
      project_check_in_ids = from(c in CheckIn, where: c.project_id in ^project_ids, select: c.id) |> Repo.all()

      # Get all goal updates
      goal_update_ids = from(u in Update, where: u.goal_id in ^goal_ids, select: u.id) |> Repo.all()

      {:ok,
       %{
         projects: project_ids,
         goals: goal_ids,
         messages: message_ids,
         project_check_ins: project_check_in_ids,
         goal_updates: goal_update_ids
       }}
    end)
  end

  defp delete_polymorphic_associations(multi) do
    multi
    |> delete_comments()
    |> delete_reactions()
  end

  defp delete_comments(multi) do
    Multi.run(multi, :comments, fn _, changes ->
      %{sub_resources: %{messages: message_ids, project_check_ins: check_in_ids, goal_updates: update_ids}} = changes

      all_entity_ids = message_ids ++ check_in_ids ++ update_ids
      {_count, comments} = Operately.Updates.delete_comments(all_entity_ids)
      {:ok, comments}
    end)
  end

  defp delete_reactions(multi) do
    Multi.run(multi, :reactions, fn _, changes ->
      %{sub_resources: %{messages: message_ids, project_check_ins: check_in_ids, goal_updates: update_ids}, comments: comment_ids} = changes

      all_entity_ids = message_ids ++ check_in_ids ++ update_ids ++ comment_ids
      {_count, reactions} = Operately.Updates.delete_reactions(all_entity_ids)
      {:ok, reactions}
    end)
  end
end
