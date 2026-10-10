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
    |> Steps.publish_template()
    |> Steps.update_published_template()
  end
end
