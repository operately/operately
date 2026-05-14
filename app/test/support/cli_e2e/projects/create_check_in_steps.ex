defmodule Operately.Support.CliE2E.Projects.CreateCheckInSteps do
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

  step :create_check_in_with_defaults, ctx do
    result =
      run_cli(ctx, [
        "projects",
        "create_check_in",
        "--project-id",
        ctx.project.id,
        "--status",
        "on_track",
        "--description",
        "Check-in created from the CLI"
      ])

    ctx
    |> Map.put(:cli_result, result)
  end

  step :create_check_in_with_overrides, ctx do
    result =
      run_cli(ctx, [
        "projects",
        "create_check_in",
        "--project-id",
        ctx.project.id,
        "--status",
        "on_track",
        "--description",
        "Check-in created with explicit CLI flags",
        "--send-notifications-to-everyone=false",
        "--subscriber-ids",
        ctx.subscriber.id
      ])

    ctx
    |> Map.put(:cli_result, result)
  end

  step :assert_check_in_created_successfully, ctx do
    assert ctx.cli_result.exit_code == 0

    payload = Jason.decode!(ctx.cli_result.output)
    check_in = payload["check_in"]

    assert is_map(check_in)
    assert check_in["id"]

    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(check_in["id"])
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    ctx
    |> Map.put(:created_check_in_id, id)
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
