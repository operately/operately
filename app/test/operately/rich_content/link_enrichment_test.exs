defmodule Operately.RichContent.LinkEnrichmentTest do
  use Operately.DataCase

  alias Operately.RichContent.LinkEnrichment
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space, name: "Website")
    Map.merge(ctx, %{origin: OperatelyWeb.Endpoint.url(), href: Paths.project_path(ctx.company, ctx.project)})
  end

  test "enriches nested documents and JSON strings together without changing source or destinations", ctx do
    href = ctx.origin <> ctx.href <> "?tab=overview#comments"
    doc = document(href)
    payload = %{project: %{description: Jason.encode!(doc)}, comments: [%{content: doc}], other: "{invalid", scalar: "123"}
    result = LinkEnrichment.enrich(payload, context(ctx))
    assert text(result.comments |> hd() |> Map.fetch!(:content)) == "Website"
    assert Jason.decode!(result.project.description) == hd(result.comments).content
    assert get_in(hd(result.comments).content, ["content", Access.at(0), "content", Access.at(0), "marks", Access.at(0), "attrs", "href"]) == href
    assert result.other == payload.other
    assert result.scalar == "123"
    assert LinkEnrichment.restore_source(result) == payload
    assert LinkEnrichment.enrich(result, context(ctx)) == result
  end

  test "keeps custom, external, cross-company, malformed and missing links", ctx do
    links = [
      document(ctx.href, "Custom"),
      document("https://example.org" <> ctx.href),
      document("/other/projects/nope"),
      document("/bad"),
      document("/#{Paths.company_id(ctx.company)}/spaces/space/kanban?taskId=%ZZ"),
      document("/#{Paths.company_id(ctx.company)}/projects/#{Operately.ShortUuid.encode!(Ecto.UUID.generate())}")
    ]

    assert LinkEnrichment.enrich(links, context(ctx)) == links
  end

  test "restores only unchanged generated labels and always removes metadata", ctx do
    doc = LinkEnrichment.enrich(document(ctx.href), context(ctx))
    edited = put_in(doc, ["content", Access.at(0), "content", Access.at(0), "text"], "My label")
    assert LinkEnrichment.restore_source(edited) == document(ctx.href, "My label")
    forged = put_in(doc, ["content", Access.at(0), "content", Access.at(0), "marks", Access.at(0), "attrs", "operatelyResourceLink", "originalText"], "Not a URL")
    assert LinkEnrichment.restore_source(forged) == document(ctx.href, "Website")
  end

  test "deduplicates across documents and performs no lookup without eligible links", ctx do
    track_queries()
    assert LinkEnrichment.enrich(%{description: document(ctx.href, "Custom")}, context(ctx)) == %{description: document(ctx.href, "Custom")}
    refute_receive :resource_query
    result = LinkEnrichment.enrich(List.duplicate(document(ctx.href), 50), context(ctx))
    assert Enum.all?(result, &(text(&1) == "Website"))
    assert_receive :resource_query
    refute_receive :resource_query
  end

  test "resolves all references beyond the batch limit in bounded batches", ctx do
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)
    tasks = Enum.map(1..101, fn i -> Factory.add_project_task(ctx, :task, :milestone, name: "Task #{i}").task end)
    docs = Enum.map(tasks, &document(Paths.task_path(ctx.company, &1)))
    track_queries()
    result = LinkEnrichment.enrich(docs, context(ctx))
    assert Enum.map(result, &text/1) == Enum.map(tasks, & &1.name)
    assert_receive :resource_query
    assert_receive :resource_query
    refute_receive :resource_query
  end

  test "batches mixed resource types and normalized URL aliases", ctx do
    ctx = Factory.add_goal(ctx, :goal, :space, name: "Goal")
    aliases = [ctx.href, "/#{Paths.company_id(ctx.company)}/projects/#{ctx.project.id}", "/#{Paths.company_id(ctx.company)}/projects/#{Operately.ShortUuid.encode!(ctx.project.id)}"]
    docs = Enum.map(aliases, &document/1) ++ [document(Paths.goal_path(ctx.company, ctx.goal))]
    track_queries()
    assert Enum.map(LinkEnrichment.enrich(docs, context(ctx)), &text/1) == ["Website", "Website", "Website", "Goal"]
    assert_receive :resource_query
    assert_receive :resource_query
    refute_receive :resource_query
  end

  test "does not expose private, deleted or draft titles to another member", ctx do
    ctx =
      ctx
      |> Factory.add_project(:secret, :space, name: "Secret", company_access_level: Operately.Access.Binding.no_access())
      |> Factory.add_goal(:deleted, :space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_draft_message(:draft, :board, title: "Draft")
      |> Factory.add_company_member(:member)

    Repo.soft_delete!(ctx.deleted)
    docs = Enum.map([Paths.project_path(ctx.company, ctx.secret), Paths.goal_path(ctx.company, ctx.deleted), Paths.message_path(ctx.company, ctx.draft)], &document/1)
    assert LinkEnrichment.enrich(docs, %{context(ctx) | person: ctx.member}) == docs
  end

  test "handles nested sections, malformed nodes, and whitespace without touching unrelated values", ctx do
    doc = document(ctx.href)
    sections = %{content: Jason.encode!(%{"summary" => doc, "lessons" => [doc], "unchanged" => " { not JSON "})}
    result = LinkEnrichment.enrich(sections, context(ctx))
    assert text(Jason.decode!(result.content)["summary"]) == "Website"
    assert LinkEnrichment.restore_source(result) == sections
    malformed = %{"type" => "doc", "content" => [nil, "text", %{"type" => "text", "marks" => nil}]}
    untouched = %{invalid: malformed, text: " { \"untouched\": true } "}
    assert LinkEnrichment.enrich(untouched, context(ctx)) == untouched
  end

  test "fresh reads reflect renames without modifying persisted rich text", ctx do
    source = document(ctx.href)
    assert text(LinkEnrichment.enrich(source, context(ctx))) == "Website"
    ctx.project |> Ecto.Changeset.change(name: "Renamed") |> Repo.update!()
    assert text(LinkEnrichment.enrich(source, context(ctx))) == "Renamed"
    assert text(source) == ctx.href
  end

  defp context(ctx), do: %{person: ctx.creator, company: ctx.company, origin: ctx.origin}
  defp text(doc), do: get_in(doc, ["content", Access.at(0), "content", Access.at(0), "text"])

  defp document(href, label \\ nil) do
    %{"type" => "doc", "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => label || href, "marks" => [%{"type" => "link", "attrs" => %{"href" => href}}]}]}]}
  end

  defp track_queries do
    id = {__MODULE__, make_ref()}
    caller = self()
    :telemetry.attach(id, [:operately, :repo, :query], fn _, _, _, _ -> if self() == caller, do: send(caller, :resource_query) end, nil)
    on_exit(fn -> :telemetry.detach(id) end)
  end
end
