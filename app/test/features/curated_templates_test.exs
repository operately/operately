defmodule Operately.Features.CuratedTemplatesTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.CuratedTemplatesSteps, as: Steps

  setup ctx do
    ctx = Factory.setup(ctx)
    {:ok, _} = Operately.People.Account.promote_to_admin(ctx.account)
    UI.login_as(ctx, ctx.creator)
  end

  feature "admin creates, publishes, and updates a KPI template", ctx do
    ctx
    |> Steps.create_kpi_draft()
    |> Steps.preview_template()
    |> Steps.publish_template()
    |> Steps.update_published_template()
  end

  feature "admin previews a goal draft", ctx do
    ctx
    |> Factory.add_curated_template(:template, type: :goal)
    |> Steps.preview_template()
  end

  feature "admin previews project tasks without editing", ctx do
    ctx
    |> Factory.add_curated_template(:template, type: :project)
    |> Steps.preview_project_tasks()
  end
end
