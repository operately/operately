defmodule Operately.Updates do
  @moduledoc """
  The Updates context.
  """

  import Ecto.Query, warn: false

  alias Operately.Activities
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Updates.Update
  alias Operately.Access.Fetch

  alias Operately.Repo
  alias Ecto.Multi

  def list_updates do
    Repo.all(Update)
  end

  def list_updates(updatable_id, updatable_type, update_type \\ nil) do
    query =
      from u in Update,
        where: u.updatable_id == ^updatable_id,
        where: u.updatable_type == ^updatable_type,
        order_by: [desc: u.inserted_at]

    query =
      case update_type do
        nil -> query
        _ -> from u in query, where: u.type == ^update_type
      end

    Repo.all(query)
  end

  def get_update!(id), do: Repo.get!(Update, id)

  def create_update(attrs \\ %{}) do
    %Update{} |> Update.changeset(attrs) |> Repo.insert()
  end

  def update_update(%Update{} = update, attrs) do
    update
    |> Update.changeset(attrs)
    |> Repo.update()
  end

  def delete_update(%Update{} = update) do
    Repo.delete(update)
  end

  def change_update(%Update{} = update, attrs \\ %{}) do
    Update.changeset(update, attrs)
  end

  alias Operately.Updates.Comment

  def list_comments(update_id) do
    query =
      from c in Comment,
        where: c.update_id == ^update_id,
        order_by: [asc: c.inserted_at]

    Repo.all(query)
  end

  def list_comments(entity_id, entity_type) do
    query =
      from c in Comment,
        where: c.entity_id == ^entity_id and c.entity_type == ^entity_type,
        order_by: [asc: c.inserted_at]

    Repo.all(query)
  end

  def get_comment!(id), do: Repo.get!(Comment, id)

  def get_comment_with_access_level(id, person_id, type) do
    case type do
      :project_check_in ->
        from(comment in Comment,
          as: :comment,
          join: check_in in Operately.Projects.CheckIn,
          on: check_in.id == comment.entity_id,
          join: project in assoc(check_in, :project),
          as: :resource,
          where: comment.id == ^id
        )

      :project_retrospective ->
        from(comment in Comment,
          as: :comment,
          join: retrospective in Operately.Projects.Retrospective,
          on: retrospective.id == comment.entity_id,
          join: project in assoc(retrospective, :project),
          as: :resource,
          where: comment.id == ^id
        )

      :project_task ->
        from(comment in Comment,
          as: :comment,
          join: task in Operately.Tasks.Task,
          on: task.id == comment.entity_id,
          join: project in assoc(task, :project),
          as: :resource,
          where: comment.id == ^id
        )

      :comment_thread ->
        from(c in Comment,
          as: :comment,
          join: t in Operately.Comments.CommentThread,
          on: t.id == c.entity_id,
          join: a in Activities.Activity,
          on: a.comment_thread_id == t.id,
          as: :resource,
          where: c.id == ^id
        )

      :goal_update ->
        from(c in Comment, as: :comment, join: u in Operately.Goals.Update, on: u.id == c.entity_id, as: :resource, where: c.id == ^id)

      :message ->
        from(c in Comment, as: :comment, join: m in Operately.Messages.Message, on: m.id == c.entity_id, as: :resource, where: c.id == ^id)

      :milestone ->
        from(mc in Operately.Comments.MilestoneComment,
          join: c in assoc(mc, :comment),
          as: :comment,
          join: m in assoc(mc, :milestone),
          join: p in assoc(m, :project),
          as: :resource,
          where: c.id == ^id
        )

      :resource_hub_document ->
        from(c in Comment, as: :comment, join: d in Operately.ResourceHubs.Document, on: c.entity_id == d.id, as: :resource, where: c.id == ^id)

      :resource_hub_file ->
        from(c in Comment, as: :comment, join: f in Operately.ResourceHubs.File, on: c.entity_id == f.id, as: :resource, where: c.id == ^id)

      :resource_hub_link ->
        from(c in Comment, as: :comment, join: l in Operately.ResourceHubs.Link, on: c.entity_id == l.id, as: :resource, where: c.id == ^id)
    end
    |> Fetch.get_resource_with_access_level(person_id, selected_resource: :comment)
  end

  def delete_comments(entity_ids) when is_list(entity_ids) do
    from(c in Comment,
      where: c.entity_id in ^entity_ids,
      select: c.id
    )
    |> Repo.delete_all()
  end

  # old version. TODO: remove
  def create_comment(_update, attrs) do
    changeset = Comment.changeset(attrs)

    Repo.insert(changeset)
  end

  def create_comment(author, update, content) do
    changeset =
      Comment.changeset(%{
        author_id: author.id,
        update_id: update.id,
        content: %{"message" => content}
      })

    Multi.new()
    |> Multi.insert(:comment, changeset)
    |> ensure_subscription_step(author)
    |> then(fn multi ->
      case update.type do
        :project_discussion ->
          Activities.insert_sync(multi, author.id, :discussion_comment_submitted, fn changes ->
            %{
              company_id: author.company_id,
              space_id: update.updatable_id,
              discussion_id: update.id,
              comment_id: changes.comment.id
            }
          end)

        :status_update ->
          Activities.insert_sync(multi, author.id, :project_status_update_commented, fn changes ->
            %{
              company_id: author.company_id,
              project_id: update.updatable_id,
              update_id: update.id,
              comment_id: changes.comment.id
            }
          end)

        _ ->
          raise "Unknown update type"
      end
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
  end

  def update_comment(%Comment{} = comment, attrs) do
    comment
    |> Comment.changeset(attrs)
    |> Repo.update()
  end

  def delete_comment(%Comment{} = comment) do
    Repo.delete(comment)
  end

  def change_comment(%Comment{} = comment, attrs \\ %{}) do
    Comment.changeset(comment, attrs)
  end

  defp ensure_subscription_step(multi, author) do
    Multi.run(multi, :comment_author_subscription, fn _, %{comment: comment} ->
      case find_subscription_list(comment) do
        {:ok, list} -> ensure_subscription(list.id, author.id)
        {:error, :not_found} -> {:ok, nil}
      end
    end)
  end

  defp find_subscription_list(%{entity_id: nil}), do: {:error, :not_found}

  defp find_subscription_list(comment) do
    SubscriptionList.get(:system, parent_id: comment.entity_id)
  end

  defp ensure_subscription(nil, _person_id), do: {:ok, nil}

  defp ensure_subscription(subscription_list_id, person_id) do
    case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
      {:error, :not_found} ->
        Operately.Notifications.create_subscription(%{
          subscription_list_id: subscription_list_id,
          person_id: person_id,
          type: :joined
        })

      {:ok, subscription} ->
        Operately.Notifications.update_subscription(subscription, %{canceled: false})
    end
  end

  alias Operately.Updates.Reaction

  def list_reactions(entity_id, entity_type) do
    query =
      from r in Reaction,
        where: r.entity_id == ^entity_id and r.entity_type == ^entity_type,
        order_by: r.inserted_at

    Repo.all(query)
  end

  def get_reaction!(id), do: Repo.get!(Reaction, id)

  def create_reaction(attrs \\ %{}) do
    %Reaction{}
    |> Reaction.changeset(attrs)
    |> Repo.insert()
  end

  def update_reaction(%Reaction{} = reaction, attrs) do
    reaction
    |> Reaction.changeset(attrs)
    |> Repo.update()
  end

  def delete_reaction(%Reaction{} = reaction) do
    Repo.delete(reaction)
  end

  def delete_reactions(entity_ids) when is_list(entity_ids) do
    from(r in Reaction,
      where: r.entity_id in ^entity_ids,
      select: r.id
    )
    |> Repo.delete_all()
  end

  def change_reaction(%Reaction{} = reaction, attrs \\ %{}) do
    Reaction.changeset(reaction, attrs)
  end
end
