defmodule Operately.Updates do
  @moduledoc """
  The Updates context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Updates.Update

  def list_updates do
    Repo.all(Update)
  end

  def list_updates(updatable_id, updatable_type) do
    query = from u in Update,
      where: u.updatable_id == ^updatable_id,
      where: u.updatable_type == ^updatable_type,
      order_by: [desc: u.inserted_at]

    Repo.all(query)
  end

  def get_update!(id), do: Repo.get!(Update, id)

  def create_update(attrs \\ %{}) do
    Repo.transaction(fn ->
      result = %Update{} |> Update.changeset(attrs) |> Repo.insert()

      case result do
        {:ok, update} ->
          {:ok, _} = Operately.Activities.submit_update_posted(update)
          :ok = publish_update_added(update)

          update
        e ->
          e
      end
    end)
  end

  def publish_update_added(update) do
    Absinthe.Subscription.publish(
      OperatelyWeb.Endpoint,
      update,
      update_added: "*")
  end
  
  def acknowledge_update(person, update) do
    Repo.transaction(fn ->
      {:ok, update} = update_update(update, %{
        acknowledged: true,
        acknowledged_at: DateTime.utc_now,
        acknowledging_person_id: person.id
      })

      {:ok, _} = Operately.Activities.submit_update_acknowledged(update)

      update
    end)
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
    query = from c in Comment,
      where: c.update_id == ^update_id,
      order_by: [asc: c.inserted_at]

    Repo.all(query)
  end

  def get_comment!(id), do: Repo.get!(Comment, id)

  def create_comment(update, attrs) do
    Repo.transaction(fn ->
      result = %Comment{} |> Comment.changeset(attrs) |> Repo.insert()

      case result do
        {:ok, comment} ->
          {:ok, _} = Operately.Activities.submit_comment_posted(comment, update)
          :ok = publish_comment_added(comment)

          comment
        e ->
          e
      end
    end)
  end

  def publish_comment_added(comment) do
    Absinthe.Subscription.publish(
      OperatelyWeb.Endpoint,
      comment,
      comment_added: "*")
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

  alias Operately.Updates.Reaction

  def list_reactions(entity_id, entity_type) do
    query = (
      from r in Reaction, 
       where: r.entity_id == ^entity_id and r.entity_type == ^entity_type, 
       order_by: r.inserted_at
    )

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

  def change_reaction(%Reaction{} = reaction, attrs \\ %{}) do
    Reaction.changeset(reaction, attrs)
  end
end
