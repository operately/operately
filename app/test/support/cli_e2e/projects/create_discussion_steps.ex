defmodule Operately.Support.CliE2E.Projects.CreateDiscussionSteps do
  use Operately.Support.CliE2E

  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.CliE2E.Helpers

  step :setup, ctx do
    previous = Helpers.enable_auth_methods()

    on_exit(fn ->
      Helpers.restore_auth_methods(previous)
    end)

    ctx = Factory.setup(ctx)
    ctx = Factory.add_space(ctx, :engineering, company_id: ctx.company.id)
    ctx = Factory.add_company_member(ctx, :subscriber)
    ctx = Factory.add_project(ctx, :project, :engineering)
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

  step :create_discussion_with_defaults, ctx do
    title = "CLI default discussion"

    result =
      run_cli(ctx, [
        "projects",
        "create_discussion",
        "--project-id",
        ctx.project.id,
        "--title",
        title,
        "--message",
        "Discussion created from the CLI"
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:discussion_title, title)
  end

  step :create_discussion_with_overrides, ctx do
    title = "CLI overridden discussion"

    result =
      run_cli(ctx, [
        "projects",
        "create_discussion",
        "--project-id",
        ctx.project.id,
        "--title",
        title,
        "--message",
        "Discussion created with explicit CLI flags",
        "--send-notifications-to-everyone=false",
        "--subscriber-ids",
        ctx.subscriber.id
      ])

    ctx
    |> Map.put(:cli_result, result)
    |> Map.put(:discussion_title, title)
  end

  step :assert_discussion_created_successfully, ctx do
    assert ctx.cli_result.exit_code == 0

    payload = Jason.decode!(ctx.cli_result.output)
    discussion = payload["discussion"]

    assert is_map(discussion)
    assert discussion["id"]

    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(discussion["id"])
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    ctx
    |> Map.put(:created_discussion_id, id)
    |> Map.put(:subscription_list, list)
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
