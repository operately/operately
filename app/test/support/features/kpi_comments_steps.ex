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

  # The comment count lives in the recorded-updates log behind the panel, so it
  # has to catch up while the thread is still open.
  step :assert_update_comment_count, ctx, count do
    UI.assert_text(ctx, to_string(count), testid: "entry-comments-toggle-#{Paths.kpi_entry_id(ctx.entry)}")
  end

  step :log_update, ctx, opts do
    ctx
    |> UI.click(testid: "kpi-detail-log-update")
    |> UI.fill(testid: "value", with: opts[:value])
    |> UI.fill_rich_text(testid: "log-update-modal", with: opts[:note])
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "log-update-modal")
  end

  step :assert_note_is_first_comment_on_latest_update, ctx, opts do
    entry = latest_entry(ctx.kpi)

    ctx
    |> UI.assert_text("1", testid: "entry-comments-toggle-#{Paths.kpi_entry_id(entry)}")
    |> UI.click(testid: "entry-comments-toggle-#{Paths.kpi_entry_id(entry)}")
    |> UI.assert_text(opts[:note])
  end

  defp latest_entry(kpi) do
    import Ecto.Query, only: [from: 2]

    from(e in Operately.Kpis.KpiEntry, where: e.kpi_id == ^kpi.id, order_by: [desc: e.period], limit: 1)
    |> Operately.Repo.one!()
  end
end
