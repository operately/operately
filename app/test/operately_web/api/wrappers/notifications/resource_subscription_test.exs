defmodule OperatelyWeb.Api.Wrappers.Notifications.ResourceSubscriptionTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyWeb.Api.Wrappers.Notifications.ResourceSubscription

  setup do
    %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
  end

  test "resolves projects, milestones, and both task types", ctx do
    ctx = ctx |> Factory.add_project_milestone(:milestone, :project) |> Factory.add_project_task(:project_task, :milestone)
    space_task = Operately.TasksFixtures.task_fixture(%{space_id: ctx.space.id, creator_id: ctx.creator.id})

    for {type, resource} <- [project: ctx.project, milestone: ctx.milestone, project_task: ctx.project_task, space_task: space_task] do
      assert {:ok, resource.subscription_list_id} == ResourceSubscription.resolve(ctx.creator, %{resource_id: resource.id, resource_type: type})
    end

    assert {:error, :not_found} = ResourceSubscription.resolve(ctx.creator, %{resource_id: space_task.id, resource_type: :project_task})
    assert {:error, :not_found} = ResourceSubscription.resolve(ctx.creator, %{resource_id: ctx.project_task.id, resource_type: :space_task})
  end

  test "resolves check-ins, retrospectives, and discussions", ctx do
    ctx =
      ctx
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)
      |> Factory.add_project_discussion(:discussion, :project)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:update, :goal, :creator)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:message, :board)

    for {type, resource} <- [project_check_in: ctx.check_in, project_retrospective: ctx.retrospective, comment_thread: ctx.discussion, goal_update: ctx.update, message: ctx.message] do
      assert {:ok, resource.subscription_list_id} == ResourceSubscription.resolve(ctx.creator, %{resource_id: resource.id, resource_type: type})
    end
  end

  test "resolves documents, files, links, and KPIs", ctx do
    ctx =
      ctx
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello"))
      |> Factory.add_file(:file, :hub)
      |> Factory.add_link(:link, :hub)

    kpi = Operately.KpisFixtures.kpi_fixture(ctx.creator, space_id: ctx.space.id)

    for {type, resource} <- [resource_hub_document: ctx.document, resource_hub_file: ctx.file, resource_hub_link: ctx.link, kpi: kpi] do
      assert {:ok, resource.subscription_list_id} == ResourceSubscription.resolve(ctx.creator, %{resource_id: resource.id, resource_type: type})
    end
  end

  test "rejects inaccessible, missing, and mismatched resources", ctx do
    other = Factory.setup(%{})
    inputs = %{resource_id: ctx.project.id, resource_type: :project}
    assert {:error, :not_found} = ResourceSubscription.resolve(other.creator, inputs)
    assert {:error, :not_found} = ResourceSubscription.resolve(ctx.creator, %{inputs | resource_id: Ecto.UUID.generate()})
    assert {:error, :not_found} = ResourceSubscription.resolve(ctx.creator, %{inputs | resource_type: :kpi})
    assert {:error, :bad_request} = ResourceSubscription.resolve(ctx.creator, %{inputs | resource_type: :unknown})
  end

  test "returns not_found when a resource has no subscription list", ctx do
    from(p in Operately.Projects.Project, where: p.id == ^ctx.project.id) |> Repo.update_all(set: [subscription_list_id: nil])
    assert {:error, :not_found} = ResourceSubscription.resolve(ctx.creator, %{resource_id: ctx.project.id, resource_type: :project})
  end
end
