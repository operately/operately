defmodule Operately.Operations.ResourceHubFolderCopyingTest do
  use Operately.DataCase

  import Operately.NotificationsFixtures

  alias Operately.ResourceHubs
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:folder1, :hub)
    |> Factory.preload(:folder1, [:node, :resource_hub])
  end

  describe "Copy content" do
    test "folder and its nested content are copied", ctx do
      ctx = create_nested_content(ctx)

      assert ResourceHubs.count_children(ctx.folder1) == 7
      assert ResourceHubs.count_children(ctx.folder2) == 3
      assert ResourceHubs.count_children(ctx.hub) == 11

      folders = ResourceHubs.list_folders(ctx.hub)

      assert length(folders) == 2
      Enum.each([ctx.folder1, ctx.folder2], fn f ->
        assert Enum.find(folders, &(&1.id == f.id))
      end)

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.folder1, ctx.hub)

      assert ResourceHubs.count_children(ctx.folder1) == 7
      assert ResourceHubs.count_children(ctx.folder2) == 3
      assert ResourceHubs.count_children(ctx.hub) == 22

      folders = ResourceHubs.list_folders(ctx.hub)

      assert length(folders) == 4

      folders = Enum.filter(folders, &(&1.id not in [ctx.folder1.id, ctx.folder2.id]))

      assert length(folders) == 2
      Enum.each(folders, fn f ->
        assert ResourceHubs.count_children(f) in [3, 7]
      end)
    end

    test "empty folder is copied", ctx do
      assert ResourceHubs.count_children(ctx.folder1) == 0
      assert ResourceHubs.count_children(ctx.hub) == 1

      assert_folder_content(ctx.folder1)

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.folder1, ctx.hub)

      assert ResourceHubs.count_children(ctx.folder1) == 0
      assert ResourceHubs.count_children(ctx.hub) == 2

      folders = ResourceHubs.list_folders(ctx.hub)

      Enum.each(folders, fn f ->
        assert_folder_content(f)
      end)
    end

    test "document within folder is copied", ctx do
      ctx =
        ctx
        |> Factory.add_document(:doc, :hub, folder: :folder1)
        |> Factory.preload(:doc, :node)

      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.hub) == 2

      assert_document_content(ctx.doc, ctx.creator)

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.folder1, ctx.hub)

      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.hub) == 4

      folders = ResourceHubs.list_folders(ctx.hub)

      assert length(folders) == 2

      Enum.each(folders, fn f ->
        assert ResourceHubs.count_children(f) == 1

        docs = ResourceHubs.list_documents(f)
        assert length(docs) == 1
        assert_document_content(hd(docs), ctx.creator)
      end)
    end

    test "file within folder is copied", ctx do
      ctx =
        ctx
        |> Factory.add_file(:file, :hub, folder: :folder1)
        |> Factory.preload(:file, :node)

      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.hub) == 2

      assert_file_content(ctx.file, ctx.creator)

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.folder1, ctx.hub)

      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.hub) == 4

      folders = ResourceHubs.list_folders(ctx.hub)

      assert length(folders) == 2

      Enum.each(folders, fn f ->
        assert ResourceHubs.count_children(f) == 1

        files = ResourceHubs.list_files(f)
        assert length(files) == 1
        assert_file_content(hd(files), ctx.creator)
      end)
    end

    test "link within folder is copied", ctx do
      ctx =
        ctx
        |> Factory.add_link(:link, :hub, folder: :folder1)
        |> Factory.preload(:link, :node)

      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.hub) == 2

      assert_link_content(ctx.link, ctx.creator)

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.folder1, ctx.hub)

      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.hub) == 4

      folders = ResourceHubs.list_folders(ctx.hub)

      assert length(folders) == 2

      Enum.each(folders, fn f ->
        assert ResourceHubs.count_children(f) == 1

        links = ResourceHubs.list_links(f)
        assert length(links) == 1
        assert_link_content(hd(links), ctx.creator)
      end)
    end
  end

  describe "Copy folder to different location" do
    setup ctx do
      ctx
      |> Factory.add_folder(:copied_folder, :hub, :folder1)
      |> Factory.preload(:copied_folder, [:node, :resource_hub])
      |> Factory.add_document(:doc, :hub, folder: :copied_folder)
      |> Factory.add_file(:file1, :hub, folder: :copied_folder)
      |> Factory.add_link(:link, :hub, folder: :copied_folder)
    end

    test "folder is copied to another folder in the same Resource Hub", ctx do
      ctx = Factory.add_folder(ctx, :dest_folder, :hub)

      assert ResourceHubs.count_children(ctx.hub) == 6
      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.dest_folder) == 0

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.copied_folder, ctx.hub, ctx.dest_folder.id)

      assert ResourceHubs.count_children(ctx.hub) == 10
      assert ResourceHubs.count_children(ctx.folder1) == 1
      assert ResourceHubs.count_children(ctx.dest_folder) == 1

      new_folder = ResourceHubs.list_folders(ctx.dest_folder) |> hd()

      assert new_folder.node.name == "copied_folder"
      assert new_folder.node.type == :folder
      assert ResourceHubs.count_children(new_folder) == 3
    end


    test "folder is copied to the root of another Resource Hub", ctx do
      ctx = Factory.add_resource_hub(ctx, :dest_hub, :space, :creator)

      assert ResourceHubs.count_children(ctx.hub) == 5
      assert ResourceHubs.count_children(ctx.dest_hub) == 0

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.copied_folder, ctx.dest_hub)

      assert ResourceHubs.count_children(ctx.hub) == 5
      assert ResourceHubs.count_children(ctx.dest_hub) == 4

      new_folder = ResourceHubs.list_folders(ctx.dest_hub) |> hd()

      assert new_folder.node.name == "copied_folder"
      assert new_folder.node.type == :folder
      assert ResourceHubs.count_children(new_folder) == 3
    end

    test "folder is copied to another folder in another Resource Hub", ctx do
      ctx =
        ctx
        |> Factory.add_resource_hub(:dest_hub, :space, :creator)
        |> Factory.add_folder(:dest_folder, :dest_hub)

      assert ResourceHubs.count_children(ctx.hub) == 5
      assert ResourceHubs.count_children(ctx.dest_hub) == 1
      assert ResourceHubs.count_children(ctx.dest_folder) == 0

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.copied_folder, ctx.dest_hub, ctx.dest_folder.id)

      assert ResourceHubs.count_children(ctx.hub) == 5
      assert ResourceHubs.count_children(ctx.dest_hub) == 5
      assert ResourceHubs.count_children(ctx.dest_folder) == 1

      new_folder = ResourceHubs.list_folders(ctx.dest_folder) |> hd()

      assert new_folder.node.name == "copied_folder"
      assert new_folder.node.type == :folder
      assert ResourceHubs.count_children(new_folder) == 3
    end
  end

  describe "Subscriptions" do
    setup ctx do
      ctx =
        ctx
        |> Factory.add_space_member(:mike, :space)
        |> Factory.add_document(:doc1, :hub, folder: :folder1)
        |> Factory.add_file(:file1, :hub, folder: :folder1)
        |> Factory.add_link(:link1, :hub, folder: :folder1)

      create_subscriptions(people: [ctx.creator, ctx.mike], parents: [ctx.doc1, ctx.file1, ctx.link1])

      ctx
      |> Factory.preload(:doc1, [subscription_list: :subscriptions])
      |> Factory.preload(:file1, [subscription_list: :subscriptions])
      |> Factory.preload(:link1, [subscription_list: :subscriptions])
    end

    test "subscriptions list and active subscriptions are copied", ctx do
      assert ResourceHubs.count_children(ctx.folder1) == 3
      assert ResourceHubs.count_children(ctx.hub) == 4

      folders = ResourceHubs.list_folders(ctx.hub)
      assert length(folders) == 1

      {:ok, _} = Operately.Operations.ResourceHubFolderCopying.run(ctx.creator, ctx.folder1, ctx.hub)

      assert ResourceHubs.count_children(ctx.folder1) == 3
      assert ResourceHubs.count_children(ctx.hub) == 8

      folders = ResourceHubs.list_folders(ctx.hub)
      assert length(folders) == 2

      folder = Enum.find(folders, &(&1.id != ctx.folder1.id))

      docs = ResourceHubs.list_documents(folder)
      assert length(docs) == 1
      assert_subscriptions_copied(ctx, hd(docs), ctx.doc1)
      assert_subscription_list_parent_id(hd(docs), ctx.doc1)

      files = ResourceHubs.list_files(folder)
      assert length(files) == 1
      assert_subscriptions_copied(ctx, hd(files), ctx.file1)
      assert_subscription_list_parent_id(hd(files), ctx.file1)

      links = ResourceHubs.list_links(folder)
      assert length(links) == 1
      assert_subscriptions_copied(ctx, hd(links), ctx.link1)
      assert_subscription_list_parent_id(hd(links), ctx.link1)
    end
  end

  #
  # Steps
  #

  defp assert_folder_content(folder) do
    assert folder.node.name == "folder1"
    assert folder.node.type == :folder
  end

  defp assert_document_content(document, creator) do
    assert document.node.name == "Document"
    assert document.node.type == :document
    assert document.content == RichText.rich_text("Content")
    assert document.author_id == creator.id
  end

  defp assert_file_content(file, creator) do
    assert file.node.name == "some name"
    assert file.node.type == :file
    assert file.description == RichText.rich_text("Content")
    assert file.author_id == creator.id
  end

  defp assert_link_content(link, creator) do
    assert link.node.name == "Link"
    assert link.node.type == :link
    assert link.description == RichText.rich_text("Description")
    assert link.url == "http://localhost:4000"
    assert link.type == :other
    assert link.author_id == creator.id
  end

  defp assert_subscriptions_copied(ctx, new_resource, original_resource) do
    new_resource = Repo.preload(new_resource, [subscription_list: :subscriptions])
    refute new_resource.subscription_list.id == original_resource.subscription_list.id

    assert length(new_resource.subscription_list.subscriptions) == 2
    assert Enum.find(new_resource.subscription_list.subscriptions, &(&1.person_id == ctx.creator.id))
    assert Enum.find(new_resource.subscription_list.subscriptions, &(&1.person_id == ctx.mike.id))
  end

  defp assert_subscription_list_parent_id(resource, original_resource) do
    {:ok, _} = SubscriptionList.get(:system, parent_id: resource.id)
    {:ok, _} = SubscriptionList.get(:system, parent_id: original_resource.id)
    refute resource.id == original_resource.id
  end

  #
  # Setup
  #

  defp create_nested_content(ctx) do
    ctx
    |> Factory.add_document(:doc1, :hub, folder: :folder1)
    |> Factory.add_document(:doc2, :hub, folder: :folder1)
    |> Factory.add_file(:file1, :hub, folder: :folder1)
    |> Factory.add_file(:file2, :hub, folder: :folder1)
    |> Factory.add_link(:link1, :hub, folder: :folder1)
    |> Factory.add_link(:link2, :hub, folder: :folder1)
    |> Factory.add_folder(:folder2, :hub, :folder1)
    |> Factory.add_document(:doc3, :hub, folder: :folder2)
    |> Factory.add_file(:file3, :hub, folder: :folder2)
    |> Factory.add_link(:link3, :hub, folder: :folder2)
  end

  defp create_subscriptions(people: people, parents: parents) do
    Enum.each(parents, fn parent ->
      {:ok, list} = SubscriptionList.get(:system, parent_id: parent.id)

      Enum.each(people, fn person ->
        subscription_fixture(subscription_list_id: list.id, person_id: person.id)
      end)
    end)
  end
end
