defmodule Operately.Support.Features.ProjectDescriptionSteps do
  use Operately.FeatureCase

  step :given_description_links_to_project, ctx do
    source = Operately.Support.RichText.resource_link(Paths.project_path(ctx.company, ctx.project))
    ctx.project |> Ecto.Changeset.change(description: source) |> Repo.update!()
    ctx
  end

  step :assert_resolved_link_without_title_request, ctx do
    href = Paths.project_path(ctx.company, ctx.project)
    ctx = UI.assert_has(ctx, Wallaby.Query.css("[data-test-id='description-section'] a[href='#{href}']", text: ctx.project.name))

    Wallaby.Browser.execute_script(ctx.session, "return performance.getEntriesByType('resource').map(entry => entry.name)", fn requests ->
      assert Enum.any?(requests, &String.contains?(&1, "projects/get"))
      refute Enum.any?(requests, &String.contains?(&1, "rich_content/resolve_links"))
    end)

    ctx
  end
end
