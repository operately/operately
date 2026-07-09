defmodule Operately.ResourceHubs.FolderCycleTest do
  use Operately.DataCase

  alias Operately.Operations.ResourceHubParentFolderEditing
  alias Operately.ResourceHubs.{Folder, FolderCycle, Node}
  alias Operately.Repo

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    {:ok, ctx}
  end

  describe "folder hierarchy cycle prevention" do
    test "can set a parent when there is no cycle", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent, :hub)
        |> Factory.add_folder(:child, :hub)

      parent = load_folder(ctx.creator, ctx.parent)
      child = load_folder(ctx.creator, ctx.child)

      assert {:ok, _} = move_folder(ctx.creator, child, parent.id)

      child = Repo.preload(child, :node, force: true)
      assert child.node.parent_folder_id == parent.id
    end

    test "cannot set a folder as its own parent", ctx do
      ctx = Factory.add_folder(ctx, :folder, :hub)
      folder = load_folder(ctx.creator, ctx.folder)

      assert {:error, changeset} = move_folder(ctx.creator, folder, folder.id)
      assert cycle_error?(changeset)
    end

    test "cannot create a direct cycle between two folders", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent, :hub)
        |> Factory.add_folder(:child, :hub, :parent)

      parent = load_folder(ctx.creator, ctx.parent)

      assert {:error, changeset} = move_folder(ctx.creator, parent, ctx.child.id)
      assert cycle_error?(changeset)
    end

    test "cannot create an indirect cycle in a multi-level hierarchy", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent, :hub)
        |> Factory.add_folder(:child, :hub, :parent)
        |> Factory.add_folder(:grandchild, :hub, :child)

      parent = load_folder(ctx.creator, ctx.parent)

      assert {:error, changeset} = move_folder(ctx.creator, parent, ctx.grandchild.id)
      assert cycle_error?(changeset)
    end

    test "prevents cycle when updating a folder in a complex hierarchy", ctx do
      # A
      # ├── B
      # │   └── C
      # └── D
      #     └── E
      ctx =
        ctx
        |> Factory.add_folder(:folder_a, :hub)
        |> Factory.add_folder(:folder_b, :hub, :folder_a)
        |> Factory.add_folder(:folder_c, :hub, :folder_b)
        |> Factory.add_folder(:folder_d, :hub, :folder_a)
        |> Factory.add_folder(:folder_e, :hub, :folder_d)

      folder_a = load_folder(ctx.creator, ctx.folder_a)

      assert {:error, changeset} = move_folder(ctx.creator, folder_a, ctx.folder_c.id)
      assert cycle_error?(changeset)

      assert {:error, changeset} = move_folder(ctx.creator, folder_a, ctx.folder_e.id)
      assert cycle_error?(changeset)
    end

    test "can change parent to another folder without creating a cycle", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent, :hub)
        |> Factory.add_folder(:child, :hub, :parent)
        |> Factory.add_folder(:grandchild, :hub, :child)
        |> Factory.add_folder(:other_parent, :hub)

      grandchild = load_folder(ctx.creator, ctx.grandchild)

      assert {:ok, _} = move_folder(ctx.creator, grandchild, ctx.other_parent.id)

      grandchild = Repo.preload(grandchild, :node, force: true)
      assert grandchild.node.parent_folder_id == ctx.other_parent.id
    end

    test "can remove a folder's parent", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent, :hub)
        |> Factory.add_folder(:child, :hub, :parent)

      child = load_folder(ctx.creator, ctx.child)

      assert {:ok, _} = move_folder(ctx.creator, child, nil)

      child = Repo.preload(child, :node, force: true)
      assert child.node.parent_folder_id == nil
    end

    test "can move a folder after breaking the chain", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent, :hub)
        |> Factory.add_folder(:child, :hub, :parent)
        |> Factory.add_folder(:grandchild, :hub, :child)
        |> Factory.add_folder(:other_parent, :hub)

      grandchild = load_folder(ctx.creator, ctx.grandchild)
      parent = load_folder(ctx.creator, ctx.parent)

      assert {:ok, _} = move_folder(ctx.creator, grandchild, ctx.other_parent.id)

      assert {:ok, _} = move_folder(ctx.creator, parent, ctx.other_parent.id)

      parent = Repo.preload(parent, :node, force: true)
      assert parent.node.parent_folder_id == ctx.other_parent.id
    end
  end

  describe "postgres_cycle_error?/1" do
    test "detects the folder cycle trigger error from postgres metadata", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent_folder, :hub)
        |> Factory.add_folder(:child_folder, :hub, :parent_folder)
        |> Factory.add_folder(:grandchild_folder, :hub, :child_folder)

      parent_folder = load_folder(ctx.creator, ctx.parent_folder)

      error =
        try do
          parent_folder.node
          |> Node.changeset(%{parent_folder_id: ctx.grandchild_folder.id})
          |> Repo.update!()
        rescue
          e in Postgrex.Error -> e
        end

      assert FolderCycle.postgres_cycle_error?(error)
      refute FolderCycle.postgres_cycle_error?(%Postgrex.Error{postgres: %{code: :raise_exception, where: "other function"}})
    end
  end

  defp move_folder(author, folder, new_parent_id) do
    ResourceHubParentFolderEditing.run(author, folder, new_parent_id)
  end

  defp cycle_error?(changeset) do
    FolderCycle.cycle_error_message() in errors_on(changeset).parent_folder_id
  end

  defp load_folder(requester, folder) do
    Folder.get!(requester, id: folder.id, opts: [preload: [:node, :resource_hub]])
  end
end
