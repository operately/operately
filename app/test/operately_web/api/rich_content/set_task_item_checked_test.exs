defmodule OperatelyWeb.Api.RichContent.SetTaskItemCheckedTest do
  use OperatelyWeb.TurboCase
  import Ecto.Query
  alias Operately.ResourceHubs.DocumentVersion

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, company_access_level: Operately.Access.Binding.no_access(), space_access_level: Operately.Access.Binding.view_access())
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.log_in_person(:creator)
  end

  @fields %{
    project: :description,
    goal: :description,
    task: :description,
    milestone: :description,
    document: :content,
    file: :description,
    link: :description,
    person: :description,
    project_discussion: :message,
    goal_discussion: :message,
    project_check_in: :description,
    goal_check_in: :message,
    project_retrospective: :content,
    comment: :content,
    project_template: :description,
    template_task: :description,
    template_milestone: :description,
    template_document: :content,
    template_discussion: :body,
    template_comment: :content,
    template_link: :description,
    template_file: :description,
    space_discussion: :body,
    kpi: :description
  }

  for {type, field} <- @fields do
    @resource_type type
    @field field

    test "#{type} persists check/uncheck and rejects stale content", ctx do
      record = target(ctx, @resource_type)
      source = content()
      record = record |> Ecto.Changeset.change(%{@field => source}) |> Repo.update!()
      inputs = inputs(record, @resource_type, @field, source)

      assert {200, %{success: true}} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs)
      assert preserved_fields(Repo.reload!(record)) == preserved_fields(record)
      updated = Map.fetch!(Repo.reload!(record), @field)
      assert checked(updated)
      activity_count = Repo.aggregate(Operately.Activities.Activity, :count)
      assert {200, %{success: true}} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs)
      assert Repo.aggregate(Operately.Activities.Activity, :count) == activity_count
      assert {400, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], %{inputs | item_path: [0, 0, 0]})

      stale = put_in(source, ["content", Access.at(0), "content", Access.at(0), "content", Access.at(0), "content", Access.at(0), "text"], "Outdated")
      assert {400, response} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], %{inputs | expected_content: Jason.encode!(stale)})
      assert (response.details[:reason] || response.details["reason"]) == "content_conflict"
      assert Map.fetch!(Repo.reload!(record), @field) == updated

      assert {200, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], %{inputs | checked: false, expected_content: Jason.encode!(updated)})
      assert Map.fetch!(Repo.reload!(record), @field) == source
    end

    test "#{type} uses the existing edit permission", ctx do
      record = target(ctx, @resource_type) |> Ecto.Changeset.change(%{@field => content()}) |> Repo.update!()

      ctx =
        ctx
        |> Factory.add_space_member(:editor, :space, permissions: :edit_access)
        |> Factory.edit_project_space_members_access(:project, :edit_access)
        |> Factory.log_in_person(:editor)

      Operately.Access.bind(Operately.Access.get_context(goal_id: ctx.goal.id), person_id: ctx.editor.id, level: Operately.Access.Binding.edit_access())
      expected = if @resource_type in [:comment, :person], do: 403, else: 200
      assert {code, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs(record, @resource_type, @field, content()))
      assert code == expected
    end

    test "#{type} rejects viewers, another company, and read-only companies", ctx do
      record = target(ctx, @resource_type) |> Ecto.Changeset.change(%{@field => content()}) |> Repo.update!()
      inputs = inputs(record, @resource_type, @field, content())
      viewer = ctx |> Factory.add_space_member(:viewer, :space, permissions: :view_access) |> Factory.log_in_person(:viewer)
      assert {code, _} = mutation(viewer.conn, [:rich_content, :set_task_item_checked], inputs)
      assert code in [403, 404]

      other = %{conn: Phoenix.ConnTest.build_conn()} |> Factory.setup() |> Factory.log_in_person(:creator)
      assert {code, _} = mutation(other.conn, [:rich_content, :set_task_item_checked], inputs)
      assert code in [403, 404]

      %{company_id: ctx.company.id, access_state: :read_only}
      |> Operately.Billing.CompanyBillingAccount.changeset()
      |> Repo.insert!()

      assert {403, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs)
      assert Map.fetch!(Repo.reload!(record), @field) == content()
    end
  end

  test "published documents create exactly one version per change", ctx do
    document = target(ctx, :document) |> Ecto.Changeset.change(content: content(), state: :published) |> Repo.update!()
    previous_versions = Repo.all(from(v in DocumentVersion, where: v.document_id == ^document.id))
    before = length(previous_versions)
    inputs = inputs(document, :document, :content, document.content)
    assert {200, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs)
    assert {200, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs)
    assert Repo.aggregate(from(v in DocumentVersion, where: v.document_id == ^document.id), :count) == before + 1
    version = Repo.one!(from(v in DocumentVersion, where: v.document_id == ^document.id, order_by: [desc: v.version_number], limit: 1))
    Enum.each(previous_versions, fn previous -> assert Repo.reload!(previous) == previous end)
    assert version.editor_id == ctx.creator.id
    assert checked(version.content)
  end

  test "draft documents retain their version and subscription configuration", ctx do
    document = target(ctx, :document) |> Ecto.Changeset.change(content: content(), state: :draft) |> Repo.update!()
    assert {200, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs(document, :document, :content, document.content))
    assert Repo.reload!(document).current_version == document.current_version
    assert Repo.reload!(document).name == document.name
  end

  test "invalid paths and fields do not create document versions", ctx do
    document = target(ctx, :document) |> Ecto.Changeset.change(content: content()) |> Repo.update!()
    inputs = inputs(document, :document, :content, document.content)
    assert {400, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], %{inputs | item_path: [0]})
    assert {400, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], %{inputs | field: "description"})
    assert Repo.reload!(document).current_version == document.current_version
    assert Repo.reload!(document).content == document.content
  end

  test "space task descriptions use the space task edit operation", ctx do
    record = Factory.create_space_task(ctx, :task, :space).task |> Ecto.Changeset.change(description: content()) |> Repo.update!()
    assert {200, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs(record, :task, :description, content()))
    assert checked(Repo.reload!(record).description)
  end

  test "scheduled goal check-ins retain schedule, status, target values, and goal progress", ctx do
    scheduled_at = DateTime.add(DateTime.utc_now(), 3600, :second) |> DateTime.truncate(:second)
    record = target(ctx, :goal_check_in) |> Ecto.Changeset.change(message: content(), state: :scheduled, scheduled_at: scheduled_at) |> Repo.update!()
    goal = Repo.reload!(ctx.goal)
    assert {200, _} = mutation(ctx.conn, [:rich_content, :set_task_item_checked], inputs(record, :goal_check_in, :message, content()))
    assert preserved_fields(Repo.reload!(record)) == preserved_fields(record)
    assert Repo.reload!(ctx.goal) == goal
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:rich_content, :set_task_item_checked], inputs(ctx.project, :project, :description, content()))
  end

  defp target(ctx, :kpi), do: Operately.KpisFixtures.kpi_fixture(ctx.creator, space_id: ctx.space.id, champion_id: ctx.creator.id)

  defp target(ctx, :space_discussion) do
    board = Operately.MessagesFixtures.messages_board_fixture(ctx.space.id)
    Operately.MessagesFixtures.message_fixture(ctx.creator.id, board.id)
  end

  defp target(ctx, :project), do: ctx.project
  defp target(ctx, :goal), do: ctx.goal
  defp target(ctx, :milestone), do: ctx.milestone
  defp target(ctx, :person), do: ctx.creator
  defp target(ctx, :task), do: Factory.add_project_task(ctx, :target, :milestone).target
  defp target(ctx, :document), do: Factory.add_document(ctx, :target, :hub).target
  defp target(ctx, :file), do: Factory.add_file(ctx, :target, :hub).target
  defp target(ctx, :link), do: Factory.add_link(ctx, :target, :hub).target
  defp target(ctx, :project_discussion), do: Factory.add_project_discussion(ctx, :target, :project).target
  defp target(ctx, :goal_discussion), do: Factory.add_goal_discussion(ctx, :target, :goal).target
  defp target(ctx, :project_check_in), do: Factory.add_project_check_in(ctx, :target, :project, :creator).target
  defp target(ctx, :goal_check_in), do: Factory.add_goal_update(ctx, :target, :goal, :creator).target
  defp target(ctx, :project_retrospective), do: Factory.add_project_retrospective(ctx, :target, :project, :creator).target
  defp target(ctx, :comment), do: ctx |> Factory.add_document(:document, :hub) |> Factory.preload(:document, :resource_hub) |> Factory.add_comment(:target, :document) |> Map.fetch!(:target)

  defp target(ctx, type) do
    ctx = Factory.add_project_template(ctx, :template, :space)

    case type do
      :project_template -> ctx.template
      :template_task -> Factory.add_project_template_task(ctx, :target, :template).target
      :template_milestone -> Factory.add_project_template_milestone(ctx, :target, :template).target
      :template_document -> Factory.add_project_template_resource_document(ctx, :target, :template).target
      :template_discussion -> Factory.add_project_template_discussion(ctx, :target, :template).target
      :template_file -> ctx |> Factory.add_blob(:blob) |> Factory.add_project_template_resource_file(:target, :template, :blob) |> Map.fetch!(:target)
      :template_link -> Factory.add_project_template_resource_link(ctx, :target, :template).target
      :template_comment -> ctx |> Factory.add_project_template_resource_document(:document, :template) |> Factory.add_project_template_comment(:target, :template, :document) |> Map.fetch!(:target)
    end
  end

  defp preserved_fields(record),
    do: Map.take(record, [:name, :title, :status, :state, :scheduled_at, :url, :type, :author_id, :creator_id, :project_id, :goal_id, :targets, :checks, :timeframe, :subscription_list_id])

  defp inputs(record, type, field, content),
    do: %{resource_id: record.id, resource_type: Atom.to_string(type), field: Atom.to_string(field), expected_content: Jason.encode!(content), item_path: [0, 0], checked: true}

  defp checked(content), do: get_in(content, ["content", Access.at(0), "content", Access.at(0), "attrs", "checked"])

  defp content,
    do: %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "taskList",
          "content" => [%{"type" => "taskItem", "attrs" => %{"checked" => false}, "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Ship it"}]}]}]
        }
      ]
    }
end
