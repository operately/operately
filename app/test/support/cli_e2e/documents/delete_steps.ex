defmodule Operately.Support.CliE2E.Documents.DeleteSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  alias Operately.ResourceHubs.{Document, File, Folder, Link}

  step :setup, ctx do
    HubScopeSteps.setup_base(ctx)
  end

  step :create_document, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI delete document",
        "--content",
        "Delete me"
      ])

    payload = Jason.decode!(result.output)

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:resource_api_id, payload["document"]["id"])
  end

  step :create_file, ctx do
    upload_file = HubScopeSteps.create_temp_upload_file!()

    result =
      run_cli(ctx, [
        "documents",
        "create_file",
        "--space-id",
        ctx.engineering.id,
        "--file",
        upload_file
      ])

    payload = Jason.decode!(result.output)

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:resource_api_id, List.first(payload["files"])["id"])
  end

  step :create_link, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "create_link",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI delete link",
        "--url",
        "https://example.com/delete",
        "--type",
        "other"
      ])

    payload = Jason.decode!(result.output)

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:resource_api_id, payload["link"]["id"])
  end

  step :create_folder, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "create_folder",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI delete folder"
      ])

    payload = Jason.decode!(result.output)

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:resource_api_id, payload["folder"]["id"])
  end

  step :delete_document, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "delete_document",
        "--document-id",
        ctx.resource_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :delete_file, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "delete_file",
        "--file-id",
        ctx.resource_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :delete_link, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "delete_link",
        "--link-id",
        ctx.resource_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :delete_folder, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "delete_folder",
        "--folder-id",
        ctx.resource_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_document_deleted, ctx do
    HubScopeSteps.assert_cli_success!(ctx)
    refute Repo.get(Document, HubScopeSteps.decode_cli_id(ctx.resource_api_id))
    ctx
  end

  step :assert_file_deleted, ctx do
    HubScopeSteps.assert_cli_success!(ctx)
    refute Repo.get(File, HubScopeSteps.decode_cli_id(ctx.resource_api_id))
    ctx
  end

  step :assert_link_deleted, ctx do
    HubScopeSteps.assert_cli_success!(ctx)
    refute Repo.get(Link, HubScopeSteps.decode_cli_id(ctx.resource_api_id))
    ctx
  end

  step :assert_folder_deleted, ctx do
    HubScopeSteps.assert_cli_success!(ctx)
    assert HubScopeSteps.cli_payload(ctx)["success"]
    refute Repo.get(Folder, HubScopeSteps.decode_cli_id(ctx.resource_api_id))
    ctx
  end
end
