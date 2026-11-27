defmodule Operately.Data.Change124MigrateProjectDiscussions do
  @moduledoc "Moves project discussion threads and their direct references in one transaction."
  import Ecto.Query
  alias Operately.Data.Change125MigrateProjectDiscussionReferences
  alias Operately.Repo

  defmodule Project do
    use Operately.Schema

    schema "projects" do
    end
  end

  defmodule Thread do
    use Operately.Schema

    schema "comment_threads" do
      field :parent_id, :binary_id
      field :parent_type, :string
      field :author_id, :binary_id
      field :subscription_list_id, :binary_id
      field :title, :string
      field :message, :map
      timestamps()
    end
  end

  defmodule Message do
    use Operately.Schema

    schema "messages" do
      field :project_id, :binary_id
      field :author_id, :binary_id
      field :subscription_list_id, :binary_id
      field :title, :string
      field :body, :map
      field :state, :string
      field :published_at, :utc_datetime
      timestamps()
    end
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :action, :string
      field :comment_thread_id, :binary_id
      field :content, :map
      field :inserted_at, :naive_datetime
    end
  end

  def run(thread_ids \\ nil) do
    # Template discussions can lack a creation event, so the threads define the source set.
    # Legacy space deletion could leave threads behind after physically deleting their project.
    project_ids = from(p in Project, select: p.id)
    threads = from(t in Thread, where: t.parent_type == "project" and (is_nil(t.parent_id) or t.parent_id in subquery(project_ids)))
    threads = if is_nil(thread_ids), do: threads, else: where(threads, [t], t.id in ^thread_ids)

    Repo.transaction(fn ->
      count = Repo.aggregate(threads, :count)
      validate_sources!(threads)
      copy_messages!(threads, count)
      Change125MigrateProjectDiscussionReferences.migrate!(threads, count)
      {^count, _} = Repo.delete_all(threads)
      :ok
    end)
  end

  defp validate_sources!(threads) do
    reject_if_any!(from(t in threads, join: m in Message, on: m.id == t.id), "conflicting message UUID")

    missing_owner = from(t in threads, where: is_nil(t.parent_id) or is_nil(t.author_id))
    reject_if_any!(missing_owner, "inconsistent project discussion ownership")

    invalid_creations =
      from([t, a] in with_creation_event(threads),
        where: not is_nil(a.id),
        where:
          not coalesce(fragment("?->>'project_id'", a.content) == type(t.parent_id, :string), false) or
            (not is_nil(a.comment_thread_id) and a.comment_thread_id != t.id)
      )

    reject_if_any!(invalid_creations, "inconsistent project discussion creation activity")
  end

  defp with_creation_event(threads) do
    from(t in threads,
      left_join: a in Activity,
      on: a.action == "project_discussion_submitted" and fragment("?->>'discussion_id'", a.content) == type(t.id, :string)
    )
  end

  defp copy_messages!(threads, count) do
    messages =
      from([t, a] in with_creation_event(threads),
        select: %{
          id: t.id,
          project_id: t.parent_id,
          author_id: t.author_id,
          title: t.title,
          body: t.message,
          subscription_list_id: t.subscription_list_id,
          state: "published",
          published_at: coalesce(a.inserted_at, t.inserted_at),
          inserted_at: t.inserted_at,
          updated_at: t.updated_at
        }
      )

    # Duplicate creation events would insert the same message UUID twice and roll back.
    {^count, _} = Repo.insert_all(Message, messages)
  end

  defp reject_if_any!(query, message) do
    if Repo.exists?(query), do: raise(message)
  end
end
