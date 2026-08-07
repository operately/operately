defmodule OperatelyWeb.Mcp.Tools.Projects.PauseTest do
  use Operately.DataCase, async: true

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.Pause
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 pauses a project with safe notification defaults" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project: project}} =
             Pause.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "message" => "Putting this on hold for now"
             })

    assert project.id == Paths.project_id(ctx.project)
    assert ToolConnHelper.reload(ctx.project).status == "paused"

    list = subscription_list!(fetch_thread(ctx.project, "project_pausing").id)

    refute list.send_to_everyone
    assert Enum.map(list.subscriptions, & &1.person_id) == [ctx.creator.id]
  end

  test "subscribes selected people from notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:other)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, _} =
             Pause.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "message" => "Pause with recipients",
               "notify_person_ids" => [Paths.person_id(ctx.other)]
             })

    list = subscription_list!(fetch_thread(ctx.project, "project_pausing").id)

    refute list.send_to_everyone
    assert Enum.sort(Enum.map(list.subscriptions, & &1.person_id)) == Enum.sort([ctx.creator.id, ctx.other.id])
  end

  test "sets send_to_everyone when notify_everyone is true" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, _} =
             Pause.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "message" => "Pause for everyone",
               "notify_everyone" => true
             })

    list = subscription_list!(fetch_thread(ctx.project, "project_pausing").id)

    assert list.send_to_everyone
  end

  test "returns invalid_arguments for malformed notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} =
             Pause.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "message" => "Pause",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp fetch_thread(project, action) do
    activity =
      from(a in Activity,
        where: a.action == ^action and a.content["project_id"] == ^project.id,
        order_by: [desc: a.inserted_at],
        limit: 1,
        preload: [:comment_thread]
      )
      |> Repo.one()

    activity.comment_thread
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
