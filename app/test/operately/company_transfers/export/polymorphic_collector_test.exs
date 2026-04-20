defmodule Operately.CompanyTransfers.Export.PolymorphicCollectorTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Export.PolymorphicCollector
  alias Operately.CompanyTransfers.Export.Relational.SchemaSnapshot
  alias Operately.Comments.CommentThread
  alias Operately.Notifications.SubscriptionList
  alias Operately.Repo
  alias Operately.Updates.{Comment, Reaction, Update}

  setup do
    {:ok, Factory.setup(%{})}
  end

  test "collects the core polymorphic tables in dependency order", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    {:ok, update} =
      Update.changeset(%{
        author_id: ctx.creator.id,
        updatable_id: ctx.project.id,
        updatable_type: :project,
        type: :message,
        content: %{"message" => tiptap_document()}
      })
      |> Repo.insert()

    {:ok, subscription_list} =
      SubscriptionList.changeset(%SubscriptionList{}, %{
        parent_id: Ecto.UUID.generate(),
        parent_type: :comment_thread,
        send_to_everyone: false
      })
      |> Repo.insert()

    {:ok, comment_thread} =
      CommentThread.changeset(%{
        parent_id: ctx.project.id,
        parent_type: :project,
        subscription_list_id: subscription_list.id,
        author_id: ctx.creator.id,
        message: tiptap_document()
      })
      |> Repo.insert()

    {:ok, comment_on_update} =
      Comment.changeset(%{
        author_id: ctx.creator.id,
        entity_id: update.id,
        entity_type: :update,
        content: %{"message" => tiptap_document()}
      })
      |> Repo.insert()

    {:ok, comment_on_thread} =
      Comment.changeset(%{
        author_id: ctx.creator.id,
        entity_id: comment_thread.id,
        entity_type: :comment_thread,
        content: %{"message" => tiptap_document()}
      })
      |> Repo.insert()

    {:ok, reaction_on_comment} =
      Reaction.changeset(%{
        person_id: ctx.creator.id,
        entity_id: comment_on_update.id,
        entity_type: :comment,
        emoji: "rocket"
      })
      |> Repo.insert()

    {:ok, reaction_on_thread} =
      Reaction.changeset(%{
        person_id: ctx.creator.id,
        entity_id: comment_thread.id,
        entity_type: :comment_thread,
        emoji: "heart"
      })
      |> Repo.insert()

    schema = SchemaSnapshot.load()

    rows =
      PolymorphicCollector.collect(schema, %{
        "projects" => [%{"id" => ctx.project.id}],
        "activities" => []
      })

    assert Enum.map(rows["updates"], & &1["id"]) == [update.id]
    assert Enum.map(rows["comment_threads"], & &1["id"]) == [comment_thread.id]
    assert Enum.map(rows["comments"], & &1["id"]) |> Enum.sort() == Enum.sort([comment_on_update.id, comment_on_thread.id])
    assert Enum.map(rows["reactions"], & &1["id"]) |> Enum.sort() == Enum.sort([reaction_on_comment.id, reaction_on_thread.id])
  end

  defp tiptap_document do
    %{"type" => "doc", "content" => []}
  end
end
