defmodule Operately.Operations.InlineThreadCreatingTest do
  use Operately.DataCase
  alias Operately.Operations.InlineThreadCreating
  alias Operately.Support.RichText
  alias Ecto.Adapters.SQL.Sandbox

  test "creates the thread and initial message atomically" do
    ctx = setup_document()
    before = document_state(ctx)
    assert {:ok, thread} = InlineThreadCreating.run(ctx.creator, ctx.document, attrs(ctx))
    assert [message] = thread.messages
    assert message.author.id == ctx.creator.id
    assert message.reactions == []
    assert thread.author.id == ctx.creator.id
    assert thread.resolved_by == nil
    assert thread.document.id == ctx.document.id
    assert document_state(ctx) == before
  end

  test "invalid content leaves no thread or message" do
    ctx = setup_document()
    assert {:error, :invalid_content} = InlineThreadCreating.run(ctx.creator, ctx.document, %{attrs(ctx) | content: %{}})
    refute Repo.exists?(Operately.Comments.InlineThread)
    refute Repo.exists?(Operately.Updates.Comment)
  end

  test "creation waiting on a concurrent save rejects the stale version" do
    # Separate, committed connections are necessary to exercise PostgreSQL locks.
    Sandbox.unboxed_run(Repo, fn ->
      ctx = setup_document()
      parent = self()

      try do
        writer =
          Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn ->
              Repo.transaction(fn ->
                {:ok, locked} = Operately.Repo.Locking.lock_for_update(Repo, ctx.document)
                send(parent, :document_locked)

                receive do
                  :save ->
                    locked = Repo.preload(locked, [:resource_hub, :node])
                    Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, locked, %{name: locked.name, content: RichText.rich_text("Changed"), expected_version: locked.current_version})
                after
                  5_000 -> Repo.rollback(:test_timeout)
                end
              end)
            end)
          end)

        assert_receive :document_locked, 2_000

        creator =
          Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn ->
              send(parent, :creating_thread)
              InlineThreadCreating.run(ctx.creator, ctx.document, attrs(ctx))
            end)
          end)

        assert_receive :creating_thread, 2_000
        assert Task.yield(creator, 100) == nil
        send(writer.pid, :save)
        assert {:ok, {:ok, _}} = Task.await(writer)
        assert {:error, :version_conflict} = Task.await(creator)
        refute Repo.exists?(from(t in Operately.Comments.InlineThread, where: t.resource_id == ^ctx.document.id))
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end

  test "a save waiting on thread creation reconciles the newly committed thread" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = setup_document()
      parent = self()

      try do
        creator = Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              {:ok, thread} = InlineThreadCreating.run(ctx.creator, ctx.document, attrs(ctx))
              send(parent, :thread_created)
              receive do
                :commit -> thread
              after
                5_000 -> Repo.rollback(:test_timeout)
              end
            end)
          end)
        end)
        assert_receive :thread_created, 2_000
        writer = Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            document = Repo.preload(ctx.document, [:resource_hub, :node])
            send(parent, :saving_document)
            Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{name: document.name, content: RichText.rich_text("Say Hello world")})
          end)
        end)
        assert_receive :saving_document, 2_000
        assert Task.yield(writer, 100) == nil
        send(creator.pid, :commit)
        assert {:ok, thread} = Task.await(creator)
        assert {:ok, document} = Task.await(writer)
        assert %{status: :attached, current_version: 2, current_from: 5, current_to: 10} = Repo.reload!(thread).anchor
        assert document.current_version == 2
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end

  defp setup_document do
    %{}
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"))
  end

  defp attrs(ctx) do
    %{source_version: ctx.document.current_version, from: 1, to: 6, quote: "Hello", content: RichText.rich_text("Review")}
  end

  defp document_state(ctx) do
    %{
      document: Repo.reload!(ctx.document),
      versions: Repo.aggregate(Operately.ResourceHubs.DocumentVersion, :count),
      activities: Repo.aggregate(Operately.Activities.Activity, :count),
      notifications: Repo.aggregate(Operately.Notifications.Notification, :count)
    }
  end
end
