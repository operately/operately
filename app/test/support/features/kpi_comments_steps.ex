defmodule Operately.Support.Features.KpiCommentsSteps do
  use Operately.FeatureCase

  import Operately.KpisFixtures

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("space_kpis")
      |> Factory.add_space(:space)
      |> Factory.log_in_person(:creator)

    kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
    entry = kpi_entry_fixture(ctx.creator, kpi)

    Map.merge(ctx, %{kpi: kpi, entry: entry})
  end

  step :visit_kpi_page, ctx do
    UI.visit(ctx, Paths.space_kpi_path(ctx.company, ctx.space, ctx.kpi))
  end

  step :open_update_comments, ctx do
    ctx
    |> UI.assert_has(testid: "kpi-detail")
    |> UI.click(testid: "entry-comments-toggle-#{Paths.kpi_entry_id(ctx.entry)}")
  end

  step :leave_comment, ctx do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
    |> UI.refute_has(testid: "post-comment")
  end

  step :assert_comment_visible, ctx do
    UI.assert_text(ctx, "This is a comment.")
  end
end
