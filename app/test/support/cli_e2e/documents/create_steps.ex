defmodule Operately.Support.CliE2E.Documents.CreateSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  alias Operately.Notifications.SubscriptionList
  alias Operately.ResourceHubs.Document

  step :setup, ctx do
    HubScopeSteps.setup_base(ctx)
  end

  step :setup_project, ctx do
    HubScopeSteps.init_project_scope(ctx)
  end

  step :setup_goal, ctx do
    HubScopeSteps.init_goal_scope(ctx)
  end

  step :create_document_with_defaults, ctx do
    name = "CLI default document"

    result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--name",
        name,
        "--content",
        "Document created from the CLI"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:document_name, name)
  end

  step :create_document_with_overrides, ctx do
    name = "CLI overridden document"

    result =
      run_cli(ctx, [
        "documents",
        "create_document",
        "--space-id",
        ctx.engineering.id,
        "--name",
        name,
        "--content",
        "Document created with explicit CLI flags",
        "--post-as-draft",
        "--send-notifications-to-everyone=false",
        "--subscriber-ids",
        ctx.subscriber.id
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:document_name, name)
  end

  step :create_document_for_parent, ctx do
    name = "CLI #{ctx.parent_scope} document"

    result =
      run_cli(ctx, [
        "documents",
        "create_document"
        | HubScopeSteps.hub_scope_flag(ctx) ++
            [
              "--name",
              name,
              "--content",
              "Document created for #{ctx.parent_scope}"
            ]
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:document_name, name)
  end

  step :assert_document_created_successfully, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    payload = HubScopeSteps.cli_payload(ctx)
    document = payload["document"]

    assert is_map(document)
    assert document["id"]

    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(document["id"])
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    document_record =
      Document
      |> Repo.get!(id)
      |> Repo.preload(:node)

    assert document_record.node.resource_hub_id == ctx.expected_resource_hub_id

    ctx
    |> Map.put(:created_document_id, id)
    |> Map.put(:created_document_api_id, document["id"])
    |> Map.put(:subscription_list, list)
    |> Map.put(:created_document, document_record)
  end

  step :assert_defaults_were_applied, ctx do
    subscription_ids = Enum.map(ctx.subscription_list.subscriptions, & &1.person_id)

    assert ctx.subscription_list.send_to_everyone
    assert subscription_ids == [ctx.creator.id]

    ctx
  end

  step :assert_overrides_were_applied, ctx do
    subscription_ids =
      ctx.subscription_list.subscriptions
      |> Enum.map(& &1.person_id)
      |> Enum.sort()

    refute ctx.subscription_list.send_to_everyone
    assert subscription_ids == Enum.sort([ctx.creator.id, ctx.subscriber.id])

    ctx
  end

  step :round_trip_table_files, ctx do
    fixtures = "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!()

    for fixture <- fixtures do
      file = create_temp_file!("table-import", fixture["markdown"], ".md")
      on_exit(fn -> File.rm(file) end)
      result = run_cli(ctx, ["documents", "create_document", "--space-id", ctx.engineering.id, "--name", fixture["name"], "--content-file", file])
      assert result.exit_code == 0, result.output
      api_id = Jason.decode!(result.output)["document"]["id"]
      document = Repo.get!(Document, HubScopeSteps.decode_cli_id(api_id))
      table = Enum.find(document.content["content"], &(&1["type"] == "table"))
      expected = fixture["markdown"] |> String.replace_prefix("Before\n\n", "") |> String.replace_suffix("\n\nAfter", "") |> String.replace("![", "[")
      assert Operately.MD.Table.render(table) == expected

      # Feed exported Markdown back through the CLI's existing update endpoint.
      File.write!(file, Operately.MD.RichText.render(document.content) <> "\n\nUpdated")
      result = run_cli(ctx, ["documents", "update_document", "--document-id", api_id, "--name", fixture["name"], "--content-file", file])
      assert result.exit_code == 0, result.output
      updated = Repo.reload!(document)
      assert Enum.find(updated.content["content"], &(&1["type"] == "table")) == table
      assert updated.current_version == document.current_version + 1
    end

    ctx
  end
end
