defmodule Operately.MD.ProjectTest do
  use Operately.DataCase

  alias Operately.Repo

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:project, :marketing)
  end

  test "renders timeline editing activities with timestamps", ctx do
    # Create timeline editing activity using Repo.insert like other tests
    {:ok, _timeline_activity} =
      Repo.insert(%Operately.Activities.Activity{
        action: "project_timeline_edited",
        author_id: ctx.creator.id,
        content: %{
          "project_id" => to_string(ctx.project.id),
          "company_id" => ctx.company.id,
          "space_id" => ctx.marketing.id
        },
        inserted_at: ~N[2024-01-15 14:30:00]
      })

    result = render_project(ctx.project)

    assert result =~ "### Timeframe History"
    assert result =~ "**2024-01-15** - #{ctx.creator.full_name} updated the project timeline"
  end

  test "it renders discussions in the markdown", ctx do
    ctx = Factory.add_project_discussion(ctx, :discussion, :project)

    rendered = render_project(ctx.project)

    assert rendered =~ "## Discussions"
    assert rendered =~ ctx.discussion.title
    assert rendered =~ ctx.creator.full_name
  end

  test "it includes timestamps for discussion messages", ctx do
    ctx = Factory.add_project_discussion(ctx, :discussion, :project)

    rendered = render_project(ctx.project)

    # Check that timestamp is included in the discussions section
    assert rendered =~ "Posted on:"

    # Check that the actual date is rendered (using the render_date format)
    expected_date = ctx.discussion.inserted_at |> Operately.Time.as_date() |> Date.to_iso8601()
    assert rendered =~ expected_date
  end

  test "it includes comments on check-ins with timestamps", ctx do
    comment_content = Operately.Support.RichText.rich_text("Rendered project check-in comment")
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator)
    ctx = Factory.preload(ctx, :check_in, :project)
    ctx = Factory.add_comment(ctx, :comment, :check_in, content: comment_content)

    rendered = render_project(ctx.project)

    # Check that the check-in is rendered
    assert rendered =~ "## Check-ins"

    # Check that comments section is included
    assert rendered =~ "#### Comments"

    # Check that the comment author and timestamp are included
    assert rendered =~ ctx.creator.full_name

    # Check that the comment timestamp is rendered
    expected_date = ctx.comment.inserted_at |> Operately.Time.as_date() |> Date.to_iso8601()
    assert rendered =~ expected_date
    assert rendered =~ "Rendered project check-in comment"
  end

  test "it renders check-ins without comments correctly", ctx do
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator)

    rendered = render_project(ctx.project)

    # Check that the check-in is rendered
    assert rendered =~ "## Check-ins"

    # Check that no comments section is included when there are no comments
    refute rendered =~ "#### Comments"
  end

  test "published check-in comments and authors load in bounded queries", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:first_author, name: "First Comment Author")
      |> Factory.add_company_member(:second_author, name: "Second Comment Author")
      |> Factory.add_project_check_in(:older, :project, :creator)
      |> Factory.add_project_check_in(:newer, :project, :creator)
      |> set_check_in_date(:older, ~U[2026-01-02 10:00:00Z])
      |> set_check_in_date(:newer, ~U[2026-01-04 10:00:00Z])
      |> add_comment_as(:older_comment, :older, :creator, "Older check-in comment")
      |> add_comment_as(:late_comment, :newer, :second_author, "Later comment")
      |> add_comment_as(:early_comment, :newer, :first_author, "Earlier comment")
      |> set_comment_date(:older_comment, ~N[2026-01-03 12:00:00])
      |> set_comment_date(:late_comment, ~N[2026-01-05 12:00:00])
      |> set_comment_date(:early_comment, ~N[2026-01-04 12:00:00])

    small_project = prepare_project(ctx.project)
    {_, small_queries} = measure_check_in_queries(fn -> Operately.MD.Project.render(small_project) end)

    ctx =
      ctx
      |> Factory.add_project_check_in(:empty, :project, :creator)
      |> Factory.add_project_check_in(:recent, :project, :creator)
      |> Factory.add_project_check_in(:unpublished, :project, :creator)
      |> set_check_in_date(:empty, ~U[2026-01-05 10:00:00Z])
      |> set_check_in_date(:recent, ~U[2026-01-06 10:00:00Z])
      |> make_draft(:unpublished)
      |> add_comment_as(:recent_comment, :recent, :first_author, "Recent check-in comment")
      |> add_comment_as(:unpublished_comment, :unpublished, :second_author, "Unpublished comment")
      |> set_comment_date(:recent_comment, ~N[2026-01-06 12:00:00])

    large_project = prepare_project(ctx.project)
    {rendered, large_queries} = measure_check_in_queries(fn -> Operately.MD.Project.render(large_project) end)

    assert Enum.frequencies(small_queries) == %{comments: 1, authors: 1}
    assert Enum.frequencies(large_queries) == %{comments: 1, authors: 1}

    [_overview, recent, empty, newer, older] = String.split(rendered, "### Check-in on ")
    assert String.starts_with?(recent, "2026-01-06")
    assert recent =~ "**First Comment Author** on 2026-01-06:"
    assert recent =~ "Recent check-in comment"
    assert String.starts_with?(empty, "2026-01-05")
    refute empty =~ "#### Comments"
    assert String.starts_with?(newer, "2026-01-04")
    assert newer =~ "**First Comment Author** on 2026-01-04:"
    assert newer =~ "**Second Comment Author** on 2026-01-05:"
    assert newer =~ "Earlier comment"
    assert newer =~ "Later comment"
    assert elem(:binary.match(newer, "Earlier comment"), 0) < elem(:binary.match(newer, "Later comment"), 0)
    assert String.starts_with?(older, "2026-01-02")
    assert older =~ "Older check-in comment"
    refute rendered =~ "Unpublished comment"
  end

  test "an empty published collection does not query comments or authors", ctx do
    ctx =
      ctx
      |> Factory.add_project_check_in(:unpublished, :project, :creator)
      |> make_draft(:unpublished)

    project = prepare_project(ctx.project)
    {rendered, queries} = measure_check_in_queries(fn -> Operately.MD.Project.render(project) end)

    assert rendered =~ "_No check-ins yet._"
    assert queries == []
  end

  test "preloaded comments are refreshed and ordered for export", ctx do
    ctx =
      ctx
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.add_comment(:late_comment, :check_in, content: rich_text("Previously loaded comment"))
      |> set_comment_date(:late_comment, ~N[2026-01-05 12:00:00])

    project = prepare_project(ctx.project) |> Repo.preload(check_ins: :comments)
    assert length(hd(project.check_ins).comments) == 1

    ctx =
      ctx
      |> Factory.add_comment(:early_comment, :check_in, content: rich_text("Comment added after preload"))
      |> set_comment_date(:early_comment, ~N[2026-01-04 12:00:00])

    rendered = Operately.MD.Project.render(project)

    assert rendered =~ "Comment added after preload"
    assert rendered =~ "**#{ctx.creator.full_name}** on"
    assert elem(:binary.match(rendered, "Comment added after preload"), 0) < elem(:binary.match(rendered, "Previously loaded comment"), 0)
  end

  test "renders published_at instead of inserted_at for published check-ins", ctx do
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator)

    {:ok, _check_in} =
      Ecto.Changeset.change(ctx.check_in, %{
        inserted_at: ~N[2026-01-01 10:00:00],
        published_at: ~U[2026-01-05 10:00:00Z]
      })
      |> Operately.Repo.update()

    rendered = render_project(ctx.project)

    assert rendered =~ "### Check-in on 2026-01-05"
    refute rendered =~ "### Check-in on 2026-01-01"
  end

  test "it renders milestones in the markdown", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    rendered = render_project(ctx.project)

    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
    refute rendered =~ "Tasks:"
  end

  test "it includes completion timestamp for completed milestones", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)
    ctx = Factory.close_project_milestone(ctx, :milestone)

    rendered = render_project(ctx.project)

    # Check that the milestone is rendered
    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
    assert rendered =~ "Status: done"

    # Check that completion timestamp is included
    assert rendered =~ "Completed:"

    # Check that the actual completion date is rendered
    milestone = Operately.Repo.reload(ctx.milestone)
    expected_date = milestone.completed_at |> Operately.Time.as_date() |> Date.to_iso8601()
    assert rendered =~ expected_date
  end

  test "it does not include completion timestamp for pending milestones", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)

    rendered = render_project(ctx.project)

    # Check that the milestone is rendered
    assert rendered =~ "## Milestones"
    assert rendered =~ ctx.milestone.title
    assert rendered =~ "Status: pending"

    # Check that completion timestamp is not included for pending milestones
    refute rendered =~ "Completed:"
  end

  test "it renders parent goal when project is linked to a goal", ctx do
    ctx = Factory.add_goal(ctx, :goal, :marketing, name: "Marketing Goal")
    ctx = Factory.add_project(ctx, :project_with_goal, :marketing, goal: :goal)

    rendered = render_project(ctx.project_with_goal)

    assert rendered =~ "Parent Goal: Marketing Goal"
    refute rendered =~ "Company-wide project"
  end

  test "it renders company-wide project when no goal is linked", ctx do
    rendered = render_project(ctx.project)

    assert rendered =~ "Parent Goal: None (Company-wide project)"
    refute rendered =~ "Parent Goal: Marketing Goal"
  end

  test "it renders project overview information", ctx do
    rendered = render_project(ctx.project)

    assert rendered =~ "# #{ctx.project.name}"
    assert rendered =~ "Status:"
    assert rendered =~ "Progress:"
    assert rendered =~ "Space: #{ctx.marketing.name}"
    assert rendered =~ "Created:"
    assert rendered =~ "Last Updated:"
    assert rendered =~ "Parent Goal: None (Company-wide project)"
  end

  test "it renders tasks grouped by milestone with assignee and due date", ctx do
    ctx =
      ctx
      |> Factory.add_project_milestone(:milestone, :project, title: "Launch")
      |> Factory.add_project_task(:task_one, :milestone, name: "Kick-off meeting")
      |> Factory.add_project_task(:task_two, :milestone, name: "Finalize assets")
      |> Factory.add_company_member(:teammate, name: "Jordan Teammate")
      |> Factory.add_task_assignee(:assignee, :task_one, :teammate)

    rendered = render_project(ctx.project)

    refute rendered =~ "## Tasks"
    assert rendered =~ "## Milestones"
    assert rendered =~ "- #{ctx.milestone.title} (Status: pending)"
    assert rendered =~ "Tasks:"
    assert rendered =~ "- Kick-off meeting | Assigned to: #{ctx.teammate.full_name} | Due: 2024-02-11"
    assert rendered =~ "- Finalize assets | Assigned to: Unassigned | Due: 2024-02-11"
  end

  test "it renders tasks without milestones in a dedicated section", ctx do
    ctx =
      ctx
      |> Factory.add_project_task(:standalone_task, nil, project_id: ctx.project.id, name: "General prep task")

    rendered = render_project(ctx.project)

    assert rendered =~ "## Milestones"
    assert rendered =~ "### Tasks Without Milestone"
    assert rendered =~ "General prep task"
  end

  test "it distinguishes unloaded resources from loaded ones", ctx do
    rendered = Operately.MD.Project.render(ctx.project)

    assert rendered =~ "Status:"
    assert rendered =~ "Progress:"
    assert rendered =~ "Space: #{ctx.marketing.name}"
    assert rendered =~ "Created:"
    assert rendered =~ "Last Updated:"
    assert rendered =~ "Parent Goal: None (Company-wide project)"
    assert rendered =~ "## Contributors"
    assert rendered =~ "## Milestones"
    assert rendered =~ "## Check-ins"
  end

  defp render_project(project) do
    project
    |> prepare_project()
    |> Operately.MD.Project.render()
  end

  defp prepare_project(project) do
    Repo.preload(project, [
      :group,
      :creator,
      :goal,
      :retrospective,
      :milestones,
      [check_ins: [:author]],
      [contributors: [:person]],
      [tasks: [:assigned_people, :milestone]]
    ])
  end

  defp rich_text(text), do: Operately.Support.RichText.rich_text(text)

  defp add_comment_as(ctx, key, check_in_key, author_key, text) do
    Factory.add_comment(ctx, key, check_in_key, creator: ctx[author_key], content: rich_text(text))
  end

  defp set_check_in_date(ctx, key, published_at) do
    check_in = Repo.update!(Ecto.Changeset.change(ctx[key], published_at: published_at))
    Map.put(ctx, key, check_in)
  end

  defp make_draft(ctx, key) do
    check_in = Repo.update!(Ecto.Changeset.change(ctx[key], state: :draft, published_at: nil))
    Map.put(ctx, key, check_in)
  end

  defp set_comment_date(ctx, key, inserted_at) do
    comment = Repo.update!(Ecto.Changeset.change(ctx[key], inserted_at: inserted_at))
    Map.put(ctx, key, comment)
  end

  defp measure_check_in_queries(fun) do
    handler_id = {__MODULE__, make_ref()}
    caller = self()

    :telemetry.attach(
      handler_id,
      [:operately, :repo, :query],
      fn _, _, metadata, _ ->
        if self() == caller do
          case metadata do
            %{source: "comments", query: query} ->
              unless String.contains?(query, "GROUP BY"), do: send(caller, {handler_id, :comments})

            %{source: "people"} ->
              send(caller, {handler_id, :authors})

            _ ->
              :ok
          end
        end
      end,
      nil
    )

    try do
      result = fun.()
      {result, collect_check_in_queries(handler_id)}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp collect_check_in_queries(handler_id) do
    receive do
      {^handler_id, query_kind} -> [query_kind | collect_check_in_queries(handler_id)]
    after
      0 -> []
    end
  end
end
