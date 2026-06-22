defmodule Operately.Support.CliE2E.Documents.CreateLinkSteps do
  use Operately.Support.CliE2E

  alias Operately.Support.CliE2E.Documents.HubScopeSteps

  alias Operately.Notifications.SubscriptionList
  alias Operately.ResourceHubs.Link

  step :setup, ctx do
    HubScopeSteps.setup_base(ctx)
  end

  step :setup_project, ctx do
    HubScopeSteps.init_project_scope(ctx)
  end

  step :setup_goal, ctx do
    HubScopeSteps.init_goal_scope(ctx)
  end

  step :create_link_with_defaults, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "create_link",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI default link",
        "--url",
        "https://example.com",
        "--type",
        "other"
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :create_link_with_overrides, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "create_link",
        "--space-id",
        ctx.engineering.id,
        "--name",
        "CLI overridden link",
        "--url",
        "https://example.com",
        "--type",
        "other",
        "--send-notifications-to-everyone=false",
        "--subscriber-ids",
        ctx.subscriber.id
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :create_link_for_parent, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "create_link"
        | HubScopeSteps.hub_scope_flag(ctx) ++
            [
              "--name",
              "CLI #{ctx.parent_scope} link",
              "--url",
              "https://example.com/#{ctx.parent_scope}",
              "--type",
              "other"
            ]
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_link_created_successfully, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    payload = HubScopeSteps.cli_payload(ctx)
    link = payload["link"]

    assert is_map(link)
    assert link["id"]

    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(link["id"])
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    link_record =
      Link
      |> Repo.get!(id)
      |> Repo.preload(:node)

    assert link_record.node.resource_hub_id == ctx.expected_resource_hub_id

    ctx
    |> Map.put(:created_link_id, id)
    |> Map.put(:created_link_api_id, link["id"])
    |> Map.put(:subscription_list, list)
    |> Map.put(:created_link, link_record)
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
end
