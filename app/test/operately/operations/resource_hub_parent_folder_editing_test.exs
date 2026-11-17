defmodule Operately.Operations.ResourceHubParentFolderEditingTest do
  use Operately.DataCase

  alias Ecto.Adapters.SQL.Sandbox
  alias Operately.Operations.{ResourceHubDeleting, ResourceHubFolderDeleting, ResourceHubParentFolderEditing}
  alias Operately.Repo.Locking

  test "a move waits for concurrent hub deletion and returns not_found instead of succeeding" do
    # Separate connections exercise the locks between the emptiness check and deletion.
    Sandbox.unboxed_run(Repo, fn ->
      ctx =
        Factory.setup(%{})
        |> Factory.add_space(:space)
        |> Factory.add_resource_hub(:hub, :space, :creator)
        |> Factory.add_folder(:folder, :hub)
        |> Factory.add_document(:document, :hub, folder: :folder)

      parent = self()

      try do
        document = Repo.preload(ctx.document, [:node, :resource_hub])
        folder = Repo.preload(ctx.folder, [:node, :resource_hub])
        assert {:ok, _} = ResourceHubFolderDeleting.run(ctx.creator, folder)

        deleter = Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Repo.transaction(fn ->
              {:ok, _} = Locking.lock_for_update(Repo, ctx.space)
              {:ok, _} = Locking.lock_for_update(Repo, ctx.hub)
              send(parent, :hub_locked)

              receive do
                :delete -> ResourceHubDeleting.run(ctx.creator, ctx.hub)
              after
                5_000 -> Repo.rollback(:test_timeout)
              end
            end)
          end)
        end)

        assert_receive :hub_locked, 2_000

        mover = Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            send(parent, :moving)
            ResourceHubParentFolderEditing.run(ctx.creator, document, nil)
          end)
        end)

        try do
          assert_receive :moving, 2_000
          assert Task.yield(mover, 100) == nil
          send(deleter.pid, :delete)
          assert {:ok, {:ok, _}} = Task.await(deleter)
          assert {:error, :not_found} = Task.await(mover)
          refute Repo.reload(ctx.hub)
          refute Repo.exists?(from a in Operately.Activities.Activity, where: a.action == "resource_hub_parent_folder_edited" and a.content["resource_hub_id"] == ^ctx.hub.id)
        after
          Task.shutdown(mover, :brutal_kill)
          Task.shutdown(deleter, :brutal_kill)
        end
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
