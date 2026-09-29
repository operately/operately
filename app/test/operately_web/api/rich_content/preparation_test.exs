defmodule OperatelyWeb.Api.RichContent.PreparationTest do
  use Operately.DataCase, async: true

  alias Operately.Support.{Factory, RichText}
  alias OperatelyWeb.Api.RichContent.{Preparation, SetTaskItemChecked}
  alias OperatelyWeb.Paths

  defmodule RenamedSnapshot do
    use TurboConnect.Mutation

    inputs do
      field :original_document, :json, skip_link_enrichment: true
      field :expected_content, :json
      field :description, :json, skip_link_enrichment: false
    end
  end

  setup do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    conn = %Plug.Conn{assigns: %{current_person: ctx.creator, current_company: ctx.company}}
    url = Paths.project_path(ctx.company, ctx.project)
    source = RichText.resource_link(url)
    %{conn: conn, source: source, enriched: Preparation.prepare_response(conn, source), saved: RichText.resource_link(url, ctx.project.name)}
  end

  test "the checkbox endpoint declares its snapshot exemption", ctx do
    conn = Plug.Conn.assign(ctx.conn, :turbo_req_handler, SetTaskItemChecked)
    prepared = Preparation.prepare_inputs(conn, %{expected_content: ctx.enriched})
    assert prepared.expected_content == ctx.source
  end

  test "renamed flagged fields are excluded and unflagged expected_content is enriched", ctx do
    conn = Plug.Conn.assign(ctx.conn, :turbo_req_handler, RenamedSnapshot)
    prepared = Preparation.prepare_inputs(conn, %{original_document: ctx.enriched, expected_content: ctx.source, description: ctx.source})
    assert prepared.original_document == ctx.source
    assert prepared.expected_content == ctx.saved
    assert prepared.description == ctx.saved
  end

  test "field metadata applies to string keys and preserves JSON representations", ctx do
    prepared = Preparation.prepare_inputs(ctx.conn, %{"original_document" => Jason.encode!(ctx.enriched), "expected_content" => Jason.encode!(ctx.source)}, RenamedSnapshot)
    assert Jason.decode!(prepared["original_document"]) == ctx.source
    assert Jason.decode!(prepared["expected_content"]) == ctx.saved
  end

  test "explicit handler metadata takes precedence over the connection handler", ctx do
    conn = Plug.Conn.assign(ctx.conn, :turbo_req_handler, SetTaskItemChecked)
    prepared = Preparation.prepare_inputs(conn, %{expected_content: ctx.source}, RenamedSnapshot)
    assert prepared.expected_content == ctx.saved
  end

  test "without endpoint metadata no field name is special", ctx do
    assert Preparation.prepare_inputs(ctx.conn, %{expected_content: ctx.source}) == %{expected_content: ctx.saved}
  end

  test "responses without authenticated company context keep source links" do
    source = RichText.resource_link("/acme/projects/example")

    for assigns <- [%{}, %{current_person: nil}, %{current_company: nil}] do
      assert Preparation.prepare_response(%Plug.Conn{assigns: assigns}, source) == source
    end
  end
end
