defmodule Operately.Support.CliE2E.DocsAndFiles.CreateFileSteps do
  use Operately.Support.CliE2E

  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.Notifications.SubscriptionList
  alias Operately.ResourceHubs.File, as: ResourceHubFile
  alias Operately.Support.CliE2E.Helpers

  @one_by_one_png Base.decode64!("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+tmH0AAAAASUVORK5CYII=")

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_space(ctx, :engineering, company_id: ctx.company.id)
    ctx = Factory.add_company_member(ctx, :subscriber)
    ctx = Factory.add_resource_hub(ctx, :resource_hub, :engineering, :creator)
    ctx = Factory.add_folder(ctx, :folder, :resource_hub)
    ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: false)

    result =
      run_cli(ctx, [
        "auth",
        "login",
        "--token",
        ctx.api_token,
        "--base-url",
        ctx.cli_base_url,
        "--profile",
        "e2e"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:profile, "e2e")
  end

  step :create_file_with_defaults, ctx do
    upload_file = create_temp_file!("operately-cli-upload", @one_by_one_png, ".png")

    on_exit(fn ->
      File.rm(upload_file)
    end)

    result =
      run_cli(ctx, [
        "docs_and_files",
        "create_file",
        "--resource-hub-id",
        ctx.resource_hub.id,
        "--file",
        upload_file
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:upload_file, upload_file)
    |> Map.put(:upload_file_bytes, @one_by_one_png)
  end

  step :create_file_with_overrides, ctx do
    upload_file = create_temp_file!("operately-cli-upload", @one_by_one_png, ".png")
    description_file = create_temp_file!("operately-cli-file-description", "# Upload notes\n\n- Visible in CLI", ".md")

    on_exit(fn ->
      File.rm(upload_file)
      File.rm(description_file)
    end)

    result =
      run_cli(ctx, [
        "docs_and_files",
        "create_file",
        "--resource-hub-id",
        ctx.resource_hub.id,
        "--folder-id",
        ctx.folder.id,
        "--file",
        upload_file,
        "--name",
        "Quarterly report",
        "--description-file",
        description_file,
        "--send-notifications-to-everyone=false",
        "--subscriber-ids",
        ctx.subscriber.id
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:upload_file, upload_file)
    |> Map.put(:upload_file_bytes, @one_by_one_png)
  end

  step :assert_file_created_successfully, ctx do
    assert ctx.cli_result.exit_code == 0

    payload = Jason.decode!(ctx.cli_result.output)
    file_payload = List.first(payload["files"])

    assert is_map(file_payload)
    assert file_payload["id"]

    {:ok, file_id} = OperatelyWeb.Api.Helpers.decode_id(file_payload["id"])

    file =
      Repo.get!(ResourceHubFile, file_id)
      |> Repo.preload([:node, :blob, :preview_blob, :subscription_list])

    {:ok, list} = SubscriptionList.get(:system, parent_id: file.id, opts: [preload: :subscriptions])
    main_blob = Blobs.get_blob!(file.blob_id)
    preview_blob = file.preview_blob_id && Blobs.get_blob!(file.preview_blob_id)

    Enum.each([main_blob, preview_blob], fn blob ->
      if blob do
        on_exit(fn ->
          File.rm(storage_path(blob))
        end)
      end
    end)

    assert file.node.resource_hub_id == ctx.resource_hub.id
    assert file.blob_id == main_blob.id
    assert preview_blob
    assert main_blob.status == :uploaded
    assert preview_blob.status == :uploaded
    assert main_blob.filename == Path.basename(ctx.upload_file)
    assert preview_blob.filename == Path.basename(ctx.upload_file)
    assert main_blob.content_type == "image/png"
    assert preview_blob.content_type == "image/png"
    assert main_blob.size == byte_size(ctx.upload_file_bytes)
    assert main_blob.width == 1
    assert main_blob.height == 1
    assert preview_blob.width == 100
    assert preview_blob.height == 100
    assert File.read!(storage_path(main_blob)) == ctx.upload_file_bytes
    assert byte_size(File.read!(storage_path(preview_blob))) > 0
    refute File.read!(storage_path(preview_blob)) == ctx.upload_file_bytes

    ctx
    |> Map.put(:created_file, file)
    |> Map.put(:subscription_list, list)
    |> Map.put(:main_blob, main_blob)
    |> Map.put(:preview_blob, preview_blob)
  end

  step :assert_defaults_were_applied, ctx do
    subscription_ids = Enum.map(ctx.subscription_list.subscriptions, & &1.person_id)

    assert ctx.created_file.node.parent_folder_id == nil
    assert ctx.created_file.node.name == Path.basename(ctx.upload_file)
    assert ctx.created_file.description == %{"type" => "doc", "content" => []}
    assert ctx.subscription_list.send_to_everyone
    assert subscription_ids == [ctx.creator.id]

    ctx
  end

  step :assert_overrides_were_applied, ctx do
    subscription_ids =
      ctx.subscription_list.subscriptions
      |> Enum.map(& &1.person_id)
      |> Enum.sort()

    text = ctx.created_file.description |> collect_text() |> Enum.join(" ")

    assert ctx.created_file.node.parent_folder_id == ctx.folder.id
    assert ctx.created_file.node.name == "Quarterly report.png"
    assert text =~ "Upload notes"
    assert text =~ "Visible in CLI"
    refute ctx.subscription_list.send_to_everyone
    assert subscription_ids == Enum.sort([ctx.creator.id, ctx.subscriber.id])

    ctx
  end

  defp collect_text(%{"text" => text}), do: [text]
  defp collect_text(%{"content" => content}) when is_list(content), do: Enum.flat_map(content, &collect_text/1)
  defp collect_text(list) when is_list(list), do: Enum.flat_map(list, &collect_text/1)
  defp collect_text(_), do: []

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end
end
