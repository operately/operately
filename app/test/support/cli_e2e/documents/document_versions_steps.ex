defmodule Operately.Support.CliE2E.Documents.DocumentVersionsSteps do
  use Operately.Support.CliE2E

  alias Operately.ResourceHubs.Document
  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  step :setup, ctx do
    HubScopeSteps.setup_base(ctx)
  end

  step :create_document_with_versions, ctx do
    create_result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI versioned document",
        "--content",
        "Version one content"
      ])

    assert create_result.exit_code == 0

    document_payload = Jason.decode!(create_result.output)
    document_api_id = document_payload["document"]["id"]

    update_to_version_two =
      run_cli(ctx, [
        "documents",
        "update_document",
        "--document-id",
        document_api_id,
        "--name",
        "CLI version two",
        "--content",
        "Version two content"
      ])

    update_to_version_three =
      run_cli(ctx, [
        "documents",
        "update_document",
        "--document-id",
        document_api_id,
        "--name",
        "CLI version three",
        "--content",
        "Version three content"
      ])

    assert update_to_version_two.exit_code == 0
    assert update_to_version_three.exit_code == 0

    current_version = update_to_version_three.output |> Jason.decode!() |> get_in(["document", "current_version"])

    ctx
    |> Map.put(:document_api_id, document_api_id)
    |> Map.put(:current_version, current_version)
    |> Map.put(:first_version_content, "Version one content")
  end

  step :list_document_versions, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "list_document_versions",
        "--document-id",
        ctx.document_api_id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_versions_listed_newest_first, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    versions = HubScopeSteps.cli_payload(ctx)["versions"]

    assert Enum.map(versions, & &1["version_number"]) == [3, 2, 1]
    assert hd(versions)["is_current"]
    refute List.last(versions)["is_current"]

    ctx
  end

  step :get_first_version, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "get_document_version",
        "--document-id",
        ctx.document_api_id,
        "--version-number",
        "1"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_first_version_content, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    version = HubScopeSteps.cli_payload(ctx)["version"]
    text = version["content"] |> HubScopeSteps.collect_text() |> Enum.join(" ")

    assert version["version_number"] == 1
    assert version["title"] == "CLI versioned document"
    assert text =~ ctx.first_version_content

    ctx
  end

  step :restore_first_version, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "restore_document_version",
        "--document-id",
        ctx.document_api_id,
        "--version-number",
        "1",
        "--expected-current-version",
        Integer.to_string(ctx.current_version)
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_document_restored_to_first_version, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    payload = HubScopeSteps.cli_payload(ctx)
    document_payload = payload["document"]
    restored_version = payload["restored_version"]

    assert document_payload["current_version"] == ctx.current_version + 1
    assert restored_version["origin"] == "restored"
    assert restored_version["restored_from_version_number"] == 1

    document =
      Document
      |> Repo.get!(HubScopeSteps.decode_cli_id(ctx.document_api_id))
      |> Repo.preload(:node)

    text = document.content |> HubScopeSteps.collect_text() |> Enum.join(" ")

    assert document.name == "CLI versioned document"
    assert text =~ ctx.first_version_content

    ctx
  end
end
