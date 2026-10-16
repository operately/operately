defmodule Operately.Features.CuratedTemplatesTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.CuratedTemplatesSteps, as: Steps

  setup ctx do
    ctx = Factory.setup(ctx)
    {:ok, _} = Operately.People.Account.promote_to_admin(ctx.account)
    UI.login_as(ctx, ctx.creator)
  end

  feature "admin creates a KPI draft with example data", ctx do
    ctx
    |> Steps.create_kpi_draft()
  end

  feature "admin publishes a KPI draft", ctx do
    ctx
    |> Factory.add_curated_template(:template, type: :kpi)
    |> Steps.publish_template()
  end

  feature "admin updates a published KPI template and its example data", ctx do
    ctx
    |> Factory.add_curated_template(:template,
      type: :kpi,
      published: true,
      preview_data: %{"entries" => [%{"period_offset" => -1, "value" => 25.5}]}
    )
    |> Steps.update_published_template()
  end

  feature "admin previews a KPI draft", ctx do
    ctx
    |> Factory.add_curated_template(:template, type: :kpi)
    |> Steps.preview_template()
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
