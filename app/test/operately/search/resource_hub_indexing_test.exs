defmodule Operately.Search.ResourceHubIndexingTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Operations.{
    ResourceHubDocumentCreating,
    ResourceHubDocumentDeleting,
    ResourceHubDocumentEditing,
    ResourceHubDocumentPublishing,
    ResourceHubFileCreating,
    ResourceHubFileDeleting,
    ResourceHubFileEditing,
    ResourceHubFolderCopying,
    ResourceHubFolderCreating,
    ResourceHubFolderDeleting,
    ResourceHubFolderRenaming,
    ResourceHubLinkCreating,
    ResourceHubLinkDeleting,
    ResourceHubLinkEditing
  }

  alias Operately.ResourceHubs
  alias Operately.Search.Entry
  alias Operately.Search.ResourceHubIndex.Worker
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:first_folder, :hub)
    |> Factory.add_folder(:second_folder, :hub)
    |> Factory.add_blob(:blob)
  end

  test "queued refreshes index document publishing and edits while deletion is immediate", ctx do
    {:ok, document} = run_operation(fn -> create_document(ctx, draft?: true, folder_id: ctx.first_folder.id) end)
    document = preload_resource(document)

    refute_entry(:resource_hub_document, document.id)
    run_refresh_jobs()
    refute_entry(:resource_hub_document, document.id)

    {:ok, document} =
      run_operation(fn ->
        ResourceHubDocumentPublishing.run(ctx.creator, document, %{
          name: "Published handbook",
          content: RichText.rich_text("Published content")
        })
      end)

    refute_entry(:resource_hub_document, document.id)
    run_refresh_jobs()
    assert_entry(:resource_hub_document, document.id, title: "Published handbook", body: "Published content")

    document = preload_resource(document)

    {:ok, document} =
      run_operation(fn ->
        ResourceHubDocumentEditing.run(ctx.creator, document, %{
          name: "Renamed handbook",
          content: RichText.rich_text("Revised content")
        })
      end)

    assert_entry(:resource_hub_document, document.id, title: "Published handbook")
    run_refresh_jobs()
    assert_entry(:resource_hub_document, document.id, title: "Renamed handbook", body: "Revised content")

    document = preload_resource(document)
    assert {:ok, _document} = run_operation(fn -> ResourceHubDocumentDeleting.run(ctx.creator, document) end)
    refute_entry(:resource_hub_document, document.id)
  end

  test "file and link refresh jobs index descriptions and edits while deletion is immediate", ctx do
    {:ok, [file]} =
      run_operation(fn ->
        ResourceHubFileCreating.run(ctx.creator, ctx.hub, %{
          files: [
            %{
              blob_id: ctx.blob.id,
              name: "Research.pdf",
              description: RichText.rich_text("File description")
            }
          ],
          folder_id: ctx.first_folder.id,
          send_to_everyone: false,
          subscriber_ids: []
        })
      end)

    {:ok, link} =
      run_operation(fn ->
        ResourceHubLinkCreating.run(ctx.creator, ctx.hub, %{
          name: "Research link",
          url: "https://private.example.test/secret",
          type: :other,
          content: RichText.rich_text("Link description"),
          folder_id: ctx.first_folder.id,
          subscription_parent_type: :resource_hub_link,
          send_to_everyone: false,
          subscriber_ids: []
        })
      end)

    run_refresh_jobs()
    assert_entry(:resource_hub_file, file.id, body: "File description", body_kind: "description")
    link_entry = assert_entry(:resource_hub_link, link.id, body: "Link description", body_kind: "description")
    refute link_entry.body =~ link.url

    file = preload_resource(file)
    link = preload_resource(link)

    {:ok, file} =
      run_operation(fn ->
        ResourceHubFileEditing.run(ctx.creator, file, %{
          name: "Updated research.pdf",
          description: RichText.rich_text("Updated file description")
        })
      end)

    {:ok, link} =
      run_operation(fn ->
        ResourceHubLinkEditing.run(ctx.creator, link, %{
          name: "Updated research link",
          url: "https://private.example.test/updated",
          type: :other,
          description: RichText.rich_text("Updated link description")
        })
      end)

    run_refresh_jobs()
    assert_entry(:resource_hub_file, file.id, title: "Updated research.pdf", body: "Updated file description")
    assert_entry(:resource_hub_link, link.id, title: "Updated research link", body: "Updated link description")

    file = preload_resource(file)
    link = preload_resource(link)
    assert {:ok, _file} = run_operation(fn -> ResourceHubFileDeleting.run(ctx.creator, file) end)
    assert {:ok, _link} = run_operation(fn -> ResourceHubLinkDeleting.run(ctx.creator, link) end)

    Enum.each(
      [
        {:resource_hub_file, file.id},
        {:resource_hub_link, link.id}
      ],
      fn {source_type, source_id} -> refute_entry(source_type, source_id) end
    )
  end

  test "folder create and rename enqueue refreshes", ctx do
    {:ok, folder} =
      run_operation(fn ->
        ResourceHubFolderCreating.run(ctx.creator, ctx.hub, %{
          name: "New folder",
          parent_folder_id: ctx.first_folder.id
        })
      end)

    run_refresh_jobs()
    assert_entry(:resource_hub_folder, folder.id, title: "New folder")

    folder = preload_resource(folder)
    assert {:ok, _changes} = run_operation(fn -> ResourceHubFolderRenaming.run(ctx.creator, folder, "Renamed folder") end)
    run_refresh_jobs()
    assert_entry(:resource_hub_folder, folder.id, title: "Renamed folder")
  end

  test "copy indexes the complete folder tree and delete removes the subtree projection", ctx do
    source =
      ctx
      |> Factory.add_folder(:copy_root, :hub)
      |> Factory.add_folder(:copy_child, :hub, :copy_root)
      |> Factory.add_document(:copy_document, :hub, folder: :copy_child)
      |> Factory.add_file(:copy_file, :hub, folder: :copy_child)
      |> Factory.add_link(:copy_link, :hub, folder: :copy_child)

    copy_root = preload_resource(source.copy_root)
    assert {:ok, copied_root} = run_operation(fn -> ResourceHubFolderCopying.run(ctx.creator, copy_root, ctx.hub, %{}) end)
    run_refresh_jobs()

    [copied_child] = ResourceHubs.list_folders(copied_root)
    [copied_document] = ResourceHubs.list_documents(copied_child)
    [copied_file] = ResourceHubs.list_files(copied_child)
    [copied_link] = ResourceHubs.list_links(copied_child)

    copied_keys = [
      {:resource_hub_folder, copied_root.id},
      {:resource_hub_folder, copied_child.id},
      {:resource_hub_document, copied_document.id},
      {:resource_hub_file, copied_file.id},
      {:resource_hub_link, copied_link.id}
    ]

    Enum.each(copied_keys, fn {source_type, source_id} -> assert_entry(source_type, source_id) end)

    copied_root = preload_resource(copied_root)
    assert {:ok, _folder} = run_operation(fn -> ResourceHubFolderDeleting.run(ctx.creator, copied_root) end)
    Enum.each(copied_keys, fn {source_type, source_id} -> refute_entry(source_type, source_id) end)

    assert Repo.get!(Operately.ResourceHubs.Document, copied_document.id)
    assert Repo.get!(Operately.ResourceHubs.File, copied_file.id)
    assert Repo.get!(Operately.ResourceHubs.Link, copied_link.id)
  end

  defp create_document(ctx, opts) do
    ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
      name: "Draft handbook",
      content: RichText.rich_text("Draft content"),
      post_as_draft: Keyword.fetch!(opts, :draft?),
      folder_id: Keyword.fetch!(opts, :folder_id),
      send_to_everyone: false,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: []
    })
  end

  defp preload_resource(resource) do
    Repo.preload(resource, [:node, :resource_hub], force: true)
  end

  defp run_operation(operation) do
    Oban.Testing.with_testing_mode(:manual, operation)
  end

  defp run_refresh_jobs do
    jobs = all_enqueued(worker: Worker)
    assert jobs != []

    Enum.each(jobs, fn job ->
      assert :ok = perform_job(Worker, job.args)
      Repo.delete!(job)
    end)
  end

  defp assert_entry(source_type, source_id, expected \\ []) do
    entry = Repo.get_by!(Entry, source_type: source_type, source_id: source_id)
    Enum.each(expected, fn {field, value} -> assert Map.fetch!(entry, field) == value end)
    entry
  end

  defp refute_entry(source_type, source_id) do
    refute Repo.get_by(Entry, source_type: source_type, source_id: source_id)
  end
end
