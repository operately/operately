defmodule Operately.Data.Change125MigrateProjectDiscussionReferences do
  @moduledoc "Moves references from the source threads to their copied messages inside Change124's transaction."
  import Ecto.Query
  alias Operately.Data.Change124MigrateProjectDiscussions.{Activity, Thread}
  alias Operately.Repo

  defmodule SubscriptionList do
    use Operately.Schema

    schema "subscription_lists" do
      field :parent_id, :binary_id
      field :parent_type, :string
    end
  end

  defmodule Comment do
    use Operately.Schema

    schema "comments" do
      field :entity_id, :binary_id
      field :entity_type, :string
    end
  end

  defmodule Reaction do
    use Operately.Schema

    schema "reactions" do
      field :entity_id, :binary_id
      field :entity_type, :string
    end
  end

  defmodule SearchJob do
    use Ecto.Schema

    schema "oban_jobs" do
      field :worker, :string
      field :queue, :string
      field :args, :map
      field :max_attempts, :integer
    end
  end

  def migrate!(threads, count) do
    validate_activity_links!(threads)
    move_subscriptions!(threads, count)
    retarget(Comment, threads)
    retarget(Reaction, threads)
    migrate_activities!(threads)
    enqueue_search_updates(threads)
  end

  defp move_subscriptions!(threads, count) do
    invalid_owners =
      from(t in threads,
        left_join: l in SubscriptionList,
        on: l.id == t.subscription_list_id,
        where:
          is_nil(l.parent_id) or l.parent_id != t.id or
            is_nil(l.parent_type) or l.parent_type != "comment_thread"
      )

    if Repo.exists?(invalid_owners), do: raise("inconsistent project discussion ownership")

    shared_lists = from(t in threads, join: other in Thread, on: other.subscription_list_id == t.subscription_list_id and other.id != t.id)
    if Repo.exists?(shared_lists), do: raise("shared project discussion subscription list")

    lists = from(l in SubscriptionList, join: t in subquery(threads), on: l.id == t.subscription_list_id)
    {^count, _} = Repo.update_all(lists, set: [parent_type: "message"])
  end

  defp validate_activity_links!(threads) do
    invalid_links =
      from(a in Activity,
        join: t in subquery(threads),
        on: a.comment_thread_id == t.id,
        where: not coalesce(a.action == "project_discussion_submitted" and fragment("?->>'discussion_id'", a.content) == type(t.id, :string), false)
      )

    if Repo.exists?(invalid_links), do: raise("unexpected activity linked to a project discussion")
  end

  defp retarget(schema, threads) do
    targets = from(r in schema, join: t in subquery(threads), on: r.entity_id == t.id, where: r.entity_type == "comment_thread")
    count = Repo.aggregate(targets, :count)
    {^count, _} = Repo.update_all(targets, set: [entity_type: "message"])
  end

  defp migrate_activities!(threads) do
    from(a in Activity,
      join: t in subquery(threads),
      on: fragment("?->>'comment_thread_id'", a.content) == type(t.id, :string),
      where: a.action == "comment_added",
      update: [set: [content: fragment("? || jsonb_build_object('discussion_id', ?)", a.content, t.id)]]
    )
    |> Repo.update_all([])

    # Deleting a thread cascades to any activity still linked by this foreign key.
    linked = from(a in Activity, join: t in subquery(threads), on: a.comment_thread_id == t.id)
    Repo.update_all(linked, set: [comment_thread_id: nil])
    if Repo.exists?(linked), do: raise("activity still references a migrated thread")
  end

  defp enqueue_search_updates(threads) do
    from(t in threads, order_by: t.id, select: t.id)
    |> Repo.stream()
    |> Stream.chunk_every(100)
    |> Enum.each(fn ids ->
      Repo.insert!(%SearchJob{worker: "Operately.Search.IndexUpdates.Worker", queue: "default", max_attempts: 5, args: %{source_type: "discussion", source_ids: ids}})
    end)
  end
end
