defmodule OperatelyWeb.Api.RichContent.ResolveLinksTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.RichContent.ResourceLinkResolver
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Product")
    |> Factory.add_project(:project, :space, name: "Website")
    |> Factory.add_goal(:goal, :space, name: "Increase NPS")
    |> Factory.add_project_milestone(:milestone, :project, title: "Beta launch")
    |> Factory.add_project_task(:task, :milestone, name: "Write copy")
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:discussion, :board, title: "Launch plan")
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, name: "Q3 plan")
    |> Factory.add_file(:hub_file, :hub)
    |> Factory.add_link(:hub_link, :hub)
    |> Factory.add_folder(:folder, :hub)
  end

  test "loads a batch with one query per resource type", ctx do
    ctx = Factory.add_project(ctx, :second_project, :space)
    handler_id = {__MODULE__, make_ref()}
    caller = self()

    :telemetry.attach(handler_id, [:operately, :repo, :query], fn _, _, metadata, _ ->
      if self() == caller, do: send(caller, {:resource_query, metadata.query})
    end, nil)

    on_exit(fn -> :telemetry.detach(handler_id) end)

    links = ResourceLinkResolver.resolve(ctx.creator, ctx.company, [
      %{type: :project, id: Paths.project_id(ctx.project)},
      %{type: :project, id: Paths.project_id(ctx.second_project)},
      %{type: :project, id: Operately.ShortUuid.encode!(ctx.project.id)},
      %{type: :goal, id: Paths.goal_id(ctx.goal)}
    ])

    assert length(links) == 3
    assert_receive {:resource_query, _}
    assert_receive {:resource_query, _}
    refute_receive {:resource_query, _}
  end

  test "requires authentication", ctx do
    assert {401, _} = query(ctx.conn, [:rich_content, :resolve_links], %{types: [], ids: []})
  end

  test "returns titles for viewable resources of every supported type", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{links: links}} =
             resolve(ctx.conn, [
               {"task", Paths.task_id(ctx.task)},
               {"project", Paths.project_id(ctx.project)},
               {"goal", Paths.goal_id(ctx.goal)},
               {"milestone", Paths.milestone_id(ctx.milestone)},
               {"discussion", Paths.message_id(ctx.discussion)},
               {"document", Paths.document_id(ctx.document)},
               {"file", Paths.file_id(ctx.hub_file)},
               {"link", Paths.link_id(ctx.hub_link)},
               {"folder", Paths.folder_id(ctx.folder)},
               {"person", Paths.person_id(ctx.creator)},
               {"space", Paths.space_id(ctx.space)}
             ])

    assert title(links, "task") == ctx.task.name
    assert title(links, "project") == "Website"
    assert title(links, "goal") == "Increase NPS"
    assert title(links, "milestone") == "Beta launch"
    assert title(links, "discussion") == "Launch plan"
    assert title(links, "document") == "Q3 plan"
    assert title(links, "file") == ctx.hub_file.name
    assert title(links, "link") == ctx.hub_link.name
    assert title(links, "folder") == "folder"
    assert title(links, "person") == ctx.creator.full_name
    assert title(links, "space") == "Product"
  end

  test "deduplicates lookups and keeps completed resources when they are viewable", ctx do
    ctx =
      ctx
      |> Factory.close_project(:project)
      |> Factory.log_in_person(:creator)

    id = Paths.project_id(ctx.project)

    assert {200, %{links: [link]}} = resolve(ctx.conn, [{"project", id}, {"project", id}])
    assert link.title == "Website"
  end

  test "omits missing, inaccessible, deleted, and invalid resources without leaking titles", ctx do
    ctx =
      ctx
      |> Factory.add_project(:secret, :space, name: "Secret", company_access_level: Binding.no_access())
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:member)

    Repo.soft_delete!(ctx.goal)

    assert {200, %{links: links}} =
             resolve(ctx.conn, [
               {"project", Paths.project_id(ctx.project)},
               {"project", Paths.project_id(ctx.secret)},
               {"goal", Paths.goal_id(ctx.goal)},
               {"project", "not-a-valid-id"},
               {"project", "missing-aaaaaaaaaaaaaaaaaaaaaa"}
             ])

    assert title(links, "project") == "Website"
    refute Enum.any?(links, &(&1.title == "Secret"))
    refute Enum.any?(links, &(&1.type == "goal"))
    assert length(links) == 1
  end

  test "does not return titles from another company", ctx do
    ctx = Factory.add_company(ctx, :other_company, ctx.account, name: "Other Company")
    other_person = ctx.other_company |> Ecto.assoc(:people) |> Repo.all() |> hd() |> Repo.preload(:account)
    other_conn = log_in_account(ctx.conn, other_person.account, ctx.other_company)

    assert {200, %{links: []}} = resolve(other_conn, [{"project", Paths.project_id(ctx.project)}])
  end

  test "caps unique resource lookups per request", ctx do
    limit = ResourceLinkResolver.max_unique_refs()

    ctx =
      Enum.reduce(1..limit, ctx, fn index, ctx ->
        Factory.add_project_task(ctx, :"capped_task_#{index}", :milestone, name: "Capped #{index}")
      end)
      |> Factory.log_in_person(:creator)

    resources =
      [ctx.task | Enum.map(1..limit, &Map.fetch!(ctx, :"capped_task_#{&1}"))]
      |> Enum.map(&{"task", Paths.task_id(&1)})

    assert length(resources) == limit + 1
    assert {200, %{links: links}} = resolve(ctx.conn, resources)
    assert length(links) == limit
    refute Enum.any?(links, &(&1.id == Paths.task_id(Map.fetch!(ctx, :"capped_task_#{limit}"))))
  end

  test "hides draft discussions from people who are not the author", ctx do
    ctx =
      ctx
      |> Factory.add_draft_message(:draft, :board, title: "Unpublished")
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:member)

    assert {200, %{links: []}} = resolve(ctx.conn, [{"discussion", Paths.message_id(ctx.draft)}])

    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{links: [link]}} = resolve(ctx.conn, [{"discussion", Paths.message_id(ctx.draft)}])
    assert link.title == "Unpublished"
  end

  defp resolve(conn, resources) do
    {types, ids} = Enum.unzip(resources)
    query(conn, [:rich_content, :resolve_links], %{types: types, ids: ids})
  end

  defp title(links, type) do
    links
    |> Enum.find(&(&1.type == type))
    |> Map.fetch!(:title)
  end
end
