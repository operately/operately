defmodule OperatelyEE.AdminApi.CuratedTemplates.UpdateTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :update], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :update], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "saves preview data independently, preserves it when omitted, and rejects invalid edits", ctx do
      ctx = Factory.add_curated_template(ctx, :template, published: true)

      preview = %{"entries" => [%{"period_offset" => -1, "value" => 416}], "annotations" => []}
      inputs = Map.merge(payload(:kpi), %{id: Paths.curated_template_id(ctx.template), expected_updated_at: DateTime.to_iso8601(ctx.template.updated_at), preview_data: Jason.encode!(preview)})

      assert {200, %{template: saved, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
      assert Jason.decode!(saved.preview_data) == preview
      assert Jason.decode!(saved.definition) == ctx.template.definition

      inputs = inputs |> Map.delete(:preview_data) |> Map.merge(%{id: saved.id, expected_updated_at: saved.updated_at, title: "Renamed"})

      assert {200, %{template: renamed, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
      assert renamed.preview_data == saved.preview_data

      inputs = %{inputs | expected_updated_at: renamed.updated_at} |> Map.put(:preview_data, Jason.encode!(%{entries: [%{period_offset: "invalid", value: 5}]}))

      assert {200, %{template: nil, errors: errors}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
      assert Enum.any?(errors, &(&1.path == "preview_data.entries.0.period_offset"))
      assert Operately.CuratedTemplates.get(ctx.template.id).preview_data == preview
    end

    test "updates a draft and rejects stale editors", ctx do
      ctx = Factory.add_curated_template(ctx, :template)
      inputs = Map.merge(payload(:kpi), %{id: Paths.curated_template_id(ctx.template), expected_updated_at: DateTime.to_iso8601(ctx.template.updated_at), title: "Edited"})
      assert {200, %{template: template, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
      assert template.title == "Edited"
      assert template.slug == inputs.slug
      assert {400, %{details: %{reason: "template_conflict"}}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
    end

    test "valid published edits are live; invalid edits leave content unchanged", ctx do
      ctx = Factory.add_curated_template(ctx, :template, published: true)
      inputs = Map.merge(payload(:kpi), %{id: Paths.curated_template_id(ctx.template), expected_updated_at: DateTime.to_iso8601(ctx.template.updated_at), definition: "{}"})
      assert {200, %{template: nil, errors: errors}} = admin_mutation(ctx.conn, [:curated_templates, :update], inputs)
      assert errors != []
      assert Operately.CuratedTemplates.get(ctx.template.id).definition["name"] == "Revenue"
      assert {200, %{template: template, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :update], %{inputs | definition: payload(:kpi).definition, title: "Live"})
      assert template.state == "published"
      assert template.title == "Live"
    end
  end

  defp payload(type) do
    %{title: "Example", slug: "example-#{type}", type: Atom.to_string(type), content_language: "en", definition: Jason.encode!(Operately.Support.Factory.CuratedTemplates.definition(type))}
  end
end
