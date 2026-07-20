defmodule Operately.Support.CliE2E.Documents.UpdateSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  alias Operately.ResourceHubs.{Document, Folder, Link}
  alias Operately.ResourceHubs.File, as: ResourceHubFile

  step :setup, ctx do
    ctx = HubScopeSteps.setup_base(ctx)

    document_result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI update document",
        "--content",
        "Original document content"
      ])

    folder_result =
      run_cli(ctx, [
        "documents",
        "create_folder",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI update folder"
      ])

    link_result =
      run_cli(ctx, [
        "documents",
        "create_link",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI update link",
        "--url",
        "https://example.com/original",
        "--type",
        "other"
      ])

    upload_file = HubScopeSteps.create_temp_upload_file!()

    file_result =
      run_cli(ctx, [
        "documents",
        "create_file",
        "--space-id",
        ctx.engineering.id,
        "--file",
        upload_file,
        "--name",
        "Original file"
      ])

    assert document_result.exit_code == 0
    assert folder_result.exit_code == 0
    assert link_result.exit_code == 0
    assert file_result.exit_code == 0

    document_payload = Jason.decode!(document_result.output)
    folder_payload = Jason.decode!(folder_result.output)
    link_payload = Jason.decode!(link_result.output)
    file_payload = Jason.decode!(file_result.output)

    ctx
    |> Map.put(:document_api_id, document_payload["document"]["id"])
    |> Map.put(:folder_api_id, folder_payload["folder"]["id"])
    |> Map.put(:link_api_id, link_payload["link"]["id"])
    |> Map.put(:file_api_id, List.first(file_payload["files"])["id"])
  end

  step :update_document, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "update_document",
        "--document-id",
        ctx.document_api_id,
        "--name",
        "CLI updated document",
        "--content",
        "Updated document content"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :update_file, ctx do
    description_file = create_temp_file!("operately-cli-update-description", "# Updated notes", ".md")

    on_exit(fn ->
      File.rm!(description_file)
    end)

    result =
      run_cli(ctx, [
        "documents",
        "update_file",
        "--file-id",
        ctx.file_api_id,
        "--name",
        "CLI updated file",
        "--description-file",
        description_file
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:description_file, description_file)
  end

  step :update_link, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "update_link",
        "--link-id",
        ctx.link_api_id,
        "--name",
        "CLI updated link",
        "--url",
        "https://example.com/updated",
        "--type",
        "other"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :rename_folder, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "rename_folder",
        "--folder-id",
        ctx.folder_api_id,
        "--new-name",
        "CLI renamed folder"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_document_updated, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    document =
      Document
      |> Repo.get!(HubScopeSteps.decode_cli_id(ctx.document_api_id))
      |> Repo.preload(:node)

    text = document.content |> HubScopeSteps.collect_text() |> Enum.join(" ")

    assert document.name == "CLI updated document"
    assert text =~ "Updated document content"

    ctx
  end

  step :assert_file_updated, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    file =
      ResourceHubFile
      |> Repo.get!(HubScopeSteps.decode_cli_id(ctx.file_api_id))
      |> Repo.preload(:node)

    text = file.description |> HubScopeSteps.collect_text() |> Enum.join(" ")

    assert file.node.name == "CLI updated file"
    assert text =~ "Updated notes"

    ctx
  end

  step :assert_link_updated, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    link =
      Link
      |> Repo.get!(HubScopeSteps.decode_cli_id(ctx.link_api_id))
      |> Repo.preload(:node)

    assert link.node.name == "CLI updated link"
    assert link.url == "https://example.com/updated"

    ctx
  end

  step :assert_folder_renamed, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    folder =
      Folder
      |> Repo.get!(HubScopeSteps.decode_cli_id(ctx.folder_api_id))
      |> Repo.preload(:node)

    assert folder.node.name == "CLI renamed folder"

    ctx
  end
end
