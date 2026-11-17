defmodule Operately.Support.Features.Projects.ProjectPageLiveUpdatesSteps do
  use Operately.FeatureCase

  alias Operately.Support.RichText
  alias OperatelyWeb.TurboCase

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.fetch_default_project_resource_hub(:hub, :project)
    |> Factory.add_company_member(:reviewer)
    |> Factory.add_api_token(:token, :creator, read_only: false)
    |> Factory.log_in_person(:creator)
  end

  step :open_project, ctx do
    ctx = ctx |> UI.visit(Paths.project_path(ctx.company, ctx.project)) |> UI.assert_has(testid: "project-name-field")
    UI.execute("mark_project_page", ctx, fn session -> Wallaby.Browser.execute_script(session, "window.projectLivePageLoaded = true") end)
  end

  step :update_description_and_reviewer_through_api, ctx do
    external_write(ctx, "projects/update_description", %{
      project_id: Paths.project_id(ctx.project),
      description: RichText.rich_text("Description from the API", :as_string)
    })

    ctx = UI.assert_text(ctx, "Description from the API")
    external_write(ctx, "projects/update_reviewer", %{project_id: Paths.project_id(ctx.project), reviewer_id: Paths.person_id(ctx.reviewer)})
    UI.assert_has(ctx, Wallaby.Query.css("[data-test-id='reviewer-field']", text: ctx.reviewer.full_name))
  end

  step :create_milestone_through_api, ctx do
    external_write(ctx, "projects/create_milestone", %{project_id: Paths.project_id(ctx.project), name: "Milestone from the API", due_date: nil})
    UI.assert_text(ctx, "Milestone from the API")
  end

  step :create_task_through_api, ctx do
    ctx = UI.click(ctx, testid: "tab-tasks")
    external_write(ctx, "tasks/create", %{type: "project", id: Paths.project_id(ctx.project), name: "Task from the API", due_date: nil})
    ctx = UI.assert_text(ctx, "Task from the API")
    assert Wallaby.Browser.current_url(ctx.session) =~ "tab=tasks"
    ctx
  end

  step :create_link_through_api, ctx do
    ctx = UI.click(ctx, testid: "tab-docs & files")
    external_write(ctx, "links/create", %{resource_hub_id: Paths.resource_hub_id(ctx.hub), name: "Link from the API", url: "https://example.com", type: "other"})
    UI.assert_text(ctx, "Link from the API")
  end

  step :start_description_draft, ctx do
    ctx
    |> UI.click(css: "[data-test-id='description-section'] button")
    |> UI.fill_rich_text("My unsaved draft")
  end

  step :update_description_through_mcp, ctx do
    assert {:ok, _} =
             OperatelyWeb.Mcp.Tools.Projects.UpdateDescription.call(OperatelyWeb.Mcp.ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "description" => "Description from MCP"
             })

    # A second visible field provides a deterministic barrier for the event's refetch.
    external_write(ctx, "projects/update_name", %{project_id: Paths.project_id(ctx.project), name: "MCP update received"})
    UI.assert_text(ctx, "MCP update received")
  end

  step :assert_draft_preserved, ctx do
    UI.assert_has(ctx, Wallaby.Query.css("[contenteditable='true']", text: "My unsaved draft"))
  end

  step :cancel_draft_and_assert_remote_description, ctx do
    ctx |> UI.click_button("Cancel") |> UI.assert_text("Description from MCP")
  end

  step :rename_in_another_browser, ctx do
    other = ctx |> UI.new_session() |> Factory.log_in_person(:creator)

    try do
      other
      |> UI.visit(Paths.project_path(ctx.company, ctx.project))
      |> UI.fill_text_field(testid: "project-name-field", with: "Renamed in another browser", submit: true)

      UI.assert_text(ctx, "Renamed in another browser")
    after
      Wallaby.end_session(other.session)
    end
  end

  step :assert_no_reload, ctx do
    Wallaby.Browser.execute_script(ctx.session, "return window.projectLivePageLoaded === true", fn value -> assert value end)
    ctx
  end

  defp external_write(ctx, endpoint, inputs) do
    assert {200, result} = TurboCase.external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, endpoint, inputs)
    result
  end
end
