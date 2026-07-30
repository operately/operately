defmodule Operately.Operations.CreateKpiTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Operations.CreateKpi

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:editor, :space, permissions: :edit_access)
    |> Factory.add_space_member(:viewer, :space, permissions: :view_access)
  end

  test "creates a KPI in the space", ctx do
    {:ok, kpi} = CreateKpi.run(ctx.creator, ctx.space, %{name: "Revenue", unit: "$", target: 100.0})

    assert kpi.name == "Revenue"
    assert kpi.space_id == ctx.space.id
    assert kpi.company_id == ctx.space.company_id
    assert kpi.creator_id == ctx.creator.id
  end

  test "records an activity and notifies space members", ctx do
    activity =
      Oban.Testing.with_testing_mode(:manual, fn ->
        {:ok, kpi} = CreateKpi.run(ctx.creator, ctx.space, %{name: "Revenue"})
        get_kpi_activity("kpi_creating", kpi.id)
      end)

    assert activity.content["name"] == "Revenue"

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: "kpi_creating")

    recipient_ids = Enum.map(notifications, & &1.person_id)
    assert ctx.editor.id in recipient_ids
    assert ctx.viewer.id in recipient_ids
    refute ctx.creator.id in recipient_ids
  end

  test "rejects a person without edit access", ctx do
    assert {:error, :forbidden} = CreateKpi.run(ctx.viewer, ctx.space, %{name: "Revenue"})
  end

  defp get_kpi_activity(action, kpi_id) do
    import Ecto.Query

    from(a in Operately.Activities.Activity,
      where: a.action == ^action and fragment("? ->> 'kpi_id' = ?", a.content, ^kpi_id)
    )
    |> Repo.one!()
  end
end
