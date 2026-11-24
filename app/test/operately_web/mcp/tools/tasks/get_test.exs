defmodule OperatelyWeb.Mcp.Tools.Tasks.GetTest do
  use Operately.DataCase, async: true

  alias Operately.Access.Binding
  alias Operately.Operations.TaskMoving
  alias Operately.Repo
  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias Operately.Tasks.Task
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.Get
  alias OperatelyWeb.Paths

  test "returns a project task with its comments in chronological order" do
    first_content = RichText.rich_text("First comment with the full discussion")
    second_content = RichText.rich_text("Second comment")

    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:commenter)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.preload(:task, [:space, project: :group])
      |> Factory.add_comment(:first_comment, :task, content: first_content)
      |> Factory.add_reactions(:reaction, :first_comment)
      |> backdate_comment(:first_comment)

    ctx = Factory.add_comment(ctx, :second_comment, :task, creator: ctx.commenter, content: second_content)

    assert {:ok, %{task: task}} = Get.call(ToolConnHelper.conn(ctx), %{"task_id" => Paths.task_id(ctx.task)})

    assert task.id == Paths.task_id(ctx.task)
    assert task.name == ctx.task.name
    assert task.type == "project"
    assert Enum.map(task.comments, & &1.id) == [Paths.comment_id(ctx.first_comment), Paths.comment_id(ctx.second_comment)]
    assert Enum.map(task.comments, & &1.content) == [Jason.encode!(first_content), Jason.encode!(second_content)]
    assert Enum.map(task.comments, & &1.author.id) == [Serializer.serialize(ctx.creator).id, Serializer.serialize(ctx.commenter).id]
    assert Enum.map(task.comments, & &1.inserted_at) == [Serializer.serialize(ctx.first_comment.inserted_at), Serializer.serialize(ctx.second_comment.inserted_at)]
    assert length(hd(task.comments).reactions) == 1
  end

  test "returns an empty comment list for a space task without comments" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.create_space_task(:task, :space)

    assert {:ok, %{task: task}} = Get.call(ToolConnHelper.conn(ctx), %{"task_id" => Paths.task_id(ctx.task)})

    assert task.id == Paths.task_id(ctx.task)
    assert task.type == "space"
    assert task.comments == []
  end

  test "returns comments from before and after a project task moves to a space" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.preload(:task, [:space, project: :group])
      |> Factory.add_comment(:project_comment, :task, content: RichText.rich_text("Before the move"))
      |> backdate_comment(:project_comment)
      |> Factory.add_space(:destination)
      |> Factory.enable_space_tool(:destination, :tasks)

    {:ok, moved} = TaskMoving.run(ctx.creator, ctx.task, :space, ctx.destination)
    space_task = Task.get!(:system, id: moved.task.id, opts: [preload: [:project, :space]])

    ctx = ctx |> Map.put(:task, space_task) |> Factory.add_comment(:space_comment, :task, content: RichText.rich_text("After the move"))

    assert {:ok, %{task: task}} = Get.call(ToolConnHelper.conn(ctx), %{"task_id" => Paths.task_id(ctx.task)})

    assert task.type == "space"
    assert Enum.map(task.comments, & &1.id) == [Paths.comment_id(ctx.project_comment), Paths.comment_id(ctx.space_comment)]
  end

  test "returns not_found for an inaccessible task in the same company" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.preload(:task, [:space, project: :group])
      |> Factory.add_comment(:comment, :task)

    assert {:error, :not_found} = Get.call(ToolConnHelper.conn_as(ctx, :member), %{"task_id" => Paths.task_id(ctx.task)})
  end

  test "returns not_found for a task outside the authenticated company" do
    ctx = Factory.setup(%{})

    other =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:error, :not_found} = Get.call(ToolConnHelper.conn(ctx), %{"task_id" => Paths.task_id(other.task)})
  end

  test "returns invalid_arguments for malformed identifiers" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} = Get.call(ToolConnHelper.conn(ctx), %{"task_id" => "definitely-not-a-valid-operately-id-%%%"})
  end

  defp backdate_comment(ctx, key) do
    comment = Map.fetch!(ctx, key)
    earlier = NaiveDateTime.add(comment.inserted_at, -60, :second)
    comment = comment |> Ecto.Changeset.change(inserted_at: earlier) |> Repo.update!()

    Map.put(ctx, key, comment)
  end
end
