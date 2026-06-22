defmodule Operately.Support.CliE2E.Documents.GetSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  step :setup, ctx do
    ctx = HubScopeSteps.setup_base(ctx)

    document_result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI get document",
        "--content",
        "Document for get test"
      ])

    folder_result =
      run_cli(ctx, [
        "documents",
        "create_folder",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI get folder"
      ])

    link_result =
      run_cli(ctx, [
        "documents",
        "create_link",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI get link",
        "--url",
        "https://example.com/get",
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
        upload_file
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
    |> Map.put(:document_name, document_payload["document"]["name"])
    |> Map.put(:folder_api_id, folder_payload["folder"]["id"])
    |> Map.put(:folder_name, folder_payload["folder"]["name"])
    |> Map.put(:link_api_id, link_payload["link"]["id"])
    |> Map.put(:link_name, link_payload["link"]["name"])
    |> Map.put(:file_api_id, List.first(file_payload["files"])["id"])
    |> Map.put(:file_name, List.first(file_payload["files"])["name"])
    |> Map.put(:upload_file, upload_file)
  end

  step :get_document, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "get_document",
        "--id",
        ctx.document_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :get_folder, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "get_folder",
        "--id",
        ctx.folder_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :get_link, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "get_link",
        "--id",
        ctx.link_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :get_file, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "get_file",
        "--id",
        ctx.file_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_document_matches, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    document = HubScopeSteps.cli_payload(ctx)["document"]
    assert document["id"] == ctx.document_api_id
    assert document["name"] == ctx.document_name

    ctx
  end

  step :assert_folder_matches, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    folder = HubScopeSteps.cli_payload(ctx)["folder"]
    assert folder["id"] == ctx.folder_api_id
    assert folder["name"] == ctx.folder_name

    ctx
  end

  step :assert_link_matches, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    link = HubScopeSteps.cli_payload(ctx)["link"]
    assert link["id"] == ctx.link_api_id
    assert link["name"] == ctx.link_name

    ctx
  end

  step :assert_file_matches, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    file = HubScopeSteps.cli_payload(ctx)["file"]
    assert file["id"] == ctx.file_api_id
    assert file["name"] == ctx.file_name

    ctx
  end
end
