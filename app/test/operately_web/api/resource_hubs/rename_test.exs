defmodule OperatelyWeb.Api.ResourceHubs.RenameTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, company_permissions: 0)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.log_in_person(:creator)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:resource_hubs, :rename], inputs(ctx))
  end

  for {company, space, expected} <- [
        {:no_access, :no_access, 404},
        {:no_access, :view_access, 403},
        {:no_access, :comment_access, 403},
        {:no_access, :edit_access, 200},
        {:no_access, :full_access, 200},
        {:view_access, :no_access, 403},
        {:comment_access, :no_access, 403},
        {:edit_access, :no_access, 200},
        {:full_access, :no_access, 200}
      ] do
    test "company #{company} and space #{space} return #{expected}", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:person)
        |> Factory.log_in_person(:person)
        |> Factory.add_space(:space, company_permissions: Binding.from_atom(unquote(company)))
        |> Factory.add_resource_hub(:hub, :space, :creator)
        |> grant_space_access(unquote(space))

      assert {unquote(expected), _} = mutation(ctx.conn, [:resource_hubs, :rename], inputs(ctx))
      assert Repo.reload(ctx.hub).name == if(unquote(expected) == 200, do: "Team library", else: ctx.hub.name)
      assert length(activities(ctx)) == if(unquote(expected) == 200, do: 1, else: 0)
      assert_rename_permission(ctx, ctx.hub, unquote(expected))
    end
  end

  test "persists the trimmed name and one activity without changing contents or identity", ctx do
    ctx = Factory.add_folder(ctx, :folder, :hub)
    assert {200, %{success: true}} = mutation(ctx.conn, [:resource_hubs, :rename], inputs(ctx, "  Team library  "))
    hub = Repo.reload(ctx.hub)
    assert hub.id == ctx.hub.id
    assert hub.space_id == ctx.space.id
    assert hub.name == "Team library"
    assert Repo.reload(ctx.folder).name == ctx.folder.name
    assert Repo.preload(Repo.reload(ctx.folder), :node).node.resource_hub_id == hub.id
    assert [activity] = activities(ctx)
    assert activity.author_id == ctx.creator.id
    assert activity.content["old_name"] == ctx.hub.name
    assert activity.content["new_name"] == hub.name
    assert activity.content["space_id"] == ctx.space.id
    assert activity.content["company_id"] == ctx.company.id
    assert activity.access_context_id == Operately.Access.get_context!(group_id: ctx.space.id).id
    activity = Operately.Activities.get_activity!(activity.id)
    serialized = activity.content |> Repo.preload([:space, :resource_hub]) |> Serializer.serialize()
    assert serialized.__typename == "activity_content_resource_hub_renamed"
    assert serialized.old_name == ctx.hub.name
    assert serialized.new_name == hub.name
    assert serialized.resource_hub.id == Paths.resource_hub_id(hub)
    assert {:ok, []} = Operately.Activities.Notifications.ResourceHubRenamed.dispatch(activity)
  end

  for name <- ["", "   ", "\t\n"] do
    test "rejects blank name #{inspect(name)} without an activity", ctx do
      assert {400, _} = mutation(ctx.conn, [:resource_hubs, :rename], inputs(ctx, unquote(name)))
      assert Repo.reload(ctx.hub).name == ctx.hub.name
      assert activities(ctx) == []
    end
  end

  test "unchanged normalized name creates no activity", ctx do
    assert {200, %{success: true}} = mutation(ctx.conn, [:resource_hubs, :rename], inputs(ctx, "  #{ctx.hub.name}  "))
    assert activities(ctx) == []
  end

  test "missing collection returns not found", ctx do
    assert {404, _} = mutation(ctx.conn, [:resource_hubs, :rename], %{resource_hub_id: Operately.ShortUuid.encode!(Ecto.UUID.generate()), new_name: "Name"})
  end

  test "company read-only mode forbids renaming", ctx do
    {:ok, account} = Operately.Billing.get_or_create_billing_account(ctx.company)
    {:ok, _} = Operately.Billing.update_billing_account(account, %{access_state: :read_only, access_state_reason: :past_due, access_state_started_at: DateTime.utc_now()})
    assert {403, _} = mutation(ctx.conn, [:resource_hubs, :rename], inputs(ctx))
    assert Repo.reload(ctx.hub).name == ctx.hub.name
    assert activities(ctx) == []
    assert_rename_permission(ctx, ctx.hub, 403)
  end

  test "project, goal, and template collections cannot be renamed", ctx do
    ctx = ctx |> Factory.add_project(:project, :space) |> Factory.add_project(:template, :space, kind: :template) |> Factory.add_goal(:goal, :space)
    ctx = ctx |> Factory.add_resource_hub(:project_hub, :project, :creator) |> Factory.add_resource_hub(:template_hub, :template, :creator) |> Factory.add_resource_hub(:goal_hub, :goal, :creator)

    for hub <- [ctx.project_hub, ctx.goal_hub, ctx.template_hub] do
      assert {403, _} = mutation(ctx.conn, [:resource_hubs, :rename], inputs(%{ctx | hub: hub}))
      assert Repo.reload(hub).name == hub.name
      assert_rename_permission(ctx, hub, 403)
    end

    assert activities(ctx) == []
  end

  defp inputs(ctx, name \\ "Team library"), do: %{resource_hub_id: Paths.resource_hub_id(ctx.hub), new_name: name}

  defp assert_rename_permission(ctx, hub, expected) do
    response = query(ctx.conn, [:resource_hubs, :get], %{id: Paths.resource_hub_id(hub), include_permissions: true})

    if expected == 404 do
      assert {404, _} = response
    else
      assert {200, %{resource_hub: %{permissions: %{can_rename_hub: can_rename}}}} = response
      assert can_rename == (expected == 200)
    end
  end

  defp grant_space_access(ctx, :no_access), do: ctx

  defp grant_space_access(ctx, level) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: ctx.person.id, access_level: Binding.from_atom(level)}])
    ctx
  end

  defp activities(ctx), do: Repo.all(from a in Activity, where: a.action == "resource_hub_renamed" and a.content["resource_hub_id"] == ^ctx.hub.id)
end
