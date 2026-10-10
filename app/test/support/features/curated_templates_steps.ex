defmodule Operately.Support.Features.CuratedTemplatesSteps do
  use Operately.FeatureCase
  alias Operately.CuratedTemplates.Template

  step :create_kpi_draft, ctx do
    ctx
    |> UI.visit("/admin/curated-templates")
    |> UI.click(testid: "create-template")
    |> UI.fill(testid: "title", with: "Retention KPI template")
    |> UI.fill(testid: "definition-unit", with: "%")
    |> UI.select(testid: "definition-cadence", option: "Monthly")
    |> UI.click(testid: "submit")
    |> UI.assert_has(css: "[data-test-id='template-state'][data-state='draft']")
    |> then(fn ctx ->
      template = Repo.get_by!(Template, title: "Retention KPI template")
      assert template.definition["unit"] == "%"
      assert template.definition["name"] == template.title
      Map.put(ctx, :template, template)
    end)
  end

  step :publish_template, ctx do
    ctx
    |> UI.click(testid: "publish-template")
    |> UI.assert_has(css: "[data-test-id='template-state'][data-state='published']")
    |> then(fn ctx ->
      assert Repo.get!(Template, ctx.template.id).state == :published
      ctx
    end)
  end

  step :update_published_template, ctx do
    previous_update = Repo.get!(Template, ctx.template.id).updated_at |> DateTime.to_iso8601()

    ctx
    |> UI.fill(testid: "title", with: "Updated retention")
    |> UI.click(testid: "submit")
    |> UI.refute_has(css: "[data-test-id='template-state'][data-updated-at='#{previous_update}']")
    |> UI.visit("/admin/curated-templates/" <> Paths.curated_template_id(ctx.template))
    |> UI.assert_has(testid: "title", value: "Updated retention")
    |> then(fn ctx ->
      assert Repo.get!(Template, ctx.template.id).definition["name"] == "Updated retention"
      ctx
    end)
  end
end
