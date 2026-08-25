defmodule Operately.Support.CliE2E.ProjectTemplates.CreateFileSteps do
  use Operately.Support.CliE2E

  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.ProjectTemplates.ResourceNode
  alias Operately.Support.CliE2E.Documents.HubScopeSteps
  alias Operately.Support.CliE2E.Helpers
  alias OperatelyWeb.Paths

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:engineering)
      |> Factory.add_project_template(:template, :engineering, name: "CLI template")
      |> Factory.add_api_token(:api_token, :creator, read_only: false)

    login_result =
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

    assert login_result.exit_code == 0, login_result.output

    ctx
    |> Map.put(:profile, "e2e")
    |> Map.put(:template_api_id, Paths.project_template_id(ctx.template))
  end

  step :add_parent_folder, ctx do
    ctx =
      Factory.add_project_template_resource_folder(ctx, :folder, :template, name: "Attachments")

    Map.put(ctx, :folder_api_id, Paths.project_template_resource_folder_id(ctx.folder))
  end

  step :create_file_at_template_root, ctx do
    upload_file = HubScopeSteps.create_temp_upload_file!()

    result =
      run_cli(ctx, [
        "project_templates",
        "create_file",
        "--template-id",
        ctx.template_api_id,
        "--file",
        upload_file,
        "--name",
        "Template asset"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:upload_file, upload_file)
    |> Map.put(:upload_file_bytes, HubScopeSteps.one_by_one_png())
    |> Map.put(:expected_name, "Template asset.png")
    |> Map.put(:expected_parent_folder_id, nil)
  end

  step :create_file_in_folder, ctx do
    upload_file = HubScopeSteps.create_temp_upload_file!()

    result =
      run_cli(ctx, [
        "project_templates",
        "create_file",
        "--template-id",
        ctx.template_api_id,
        "--parent-folder-id",
        ctx.folder_api_id,
        "--file",
        upload_file,
        "--name",
        "Folder asset"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:upload_file, upload_file)
    |> Map.put(:upload_file_bytes, HubScopeSteps.one_by_one_png())
    |> Map.put(:expected_name, "Folder asset.png")
    |> Map.put(:expected_parent_folder_id, ctx.folder.id)
  end

  step :assert_file_created_successfully, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    payload = HubScopeSteps.cli_payload(ctx)
    file_payload = List.first(payload["files"])

    assert is_map(file_payload)
    assert file_payload["id"]

    node =
      ResourceNode
      |> Repo.get_by!(project_template_id: ctx.template.id, type: :file)
      |> Repo.preload(file: [:blob, :preview_blob])

    file = node.file
    main_blob = Blobs.get_blob!(file.blob_id)
    preview_blob = file.preview_blob_id && Blobs.get_blob!(file.preview_blob_id)

    Enum.each([main_blob, preview_blob], fn blob ->
      if blob do
        on_exit(fn ->
          File.rm(storage_path(blob))
        end)
      end
    end)

    assert node.parent_folder_id == ctx.expected_parent_folder_id
    assert file.name == ctx.expected_name
    assert main_blob.status == :uploaded
    assert preview_blob
    assert preview_blob.status == :uploaded
    assert main_blob.content_type == "image/png"
    assert main_blob.size == byte_size(ctx.upload_file_bytes)
    assert File.read!(storage_path(main_blob)) == ctx.upload_file_bytes

    ctx
    |> Map.put(:created_file, file)
    |> Map.put(:created_node, node)
  end

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end
end
