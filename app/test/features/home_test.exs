defmodule Operately.Features.HomeTest do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Operations.ProjectCreation
  alias Operately.Support.Features.HomeSteps, as: Steps

  import Ecto.Query, only: [from: 2]

  feature "company loads when person is member", ctx do
    ctx
    |> Steps.given_a_company_exists()
    |> Steps.given_a_user_is_logged_in_as_member()
    |> Steps.visit_company_home_page()
    |> Steps.assert_company_page_loaded()
  end

  feature "returns 404 when person is not member", ctx do
    ctx
    |> Steps.given_a_company_exists()
    |> Steps.given_a_user_is_logged_in_as_non_member()
    |> Steps.visit_company_home_page()
    |> Steps.assert_404_page()
  end

  feature "company admins delete an activity from the feed through the item actions menu", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:product_space)
      |> create_project_with_activity("Feed Menu Project")

    ctx =
      ctx
      |> UI.login_as(ctx.creator)
      |> UI.visit(Paths.home_path(ctx.company))

    ctx
    |> UI.assert_text("Feed Menu Project")
    |> UI.hover(css: "[data-activity-id=\"#{Paths.activity_id(ctx.activity)}\"]")
    |> UI.click(testid: "feed-activity-options")
    |> UI.click(testid: "delete-feed-activity")
    |> UI.assert_has(testid: "delete-feed-activity-dialog")
    |> UI.click_button("Delete")
    |> UI.refute_text("Feed Menu Project")
  end

  defp create_project_with_activity(ctx, name) do
    {:ok, project} =
      ProjectCreation.run(%ProjectCreation{
        company_id: ctx.company.id,
        name: name,
        creator_id: ctx.creator.id,
        creator_role: "Contributor",
        visibility: "everyone",
        group_id: ctx.product_space.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.view_access()
      })

    activity =
      from(a in Activity,
        where: a.action == "project_created",
        where: fragment("? ->> ? = ?", a.content, "project_id", ^project.id)
      )
      |> Repo.one!()

    ctx
    |> Map.put(:project, project)
    |> Map.put(:activity, activity)
  end
end
