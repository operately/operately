defmodule OperatelyEE.AdminApi.CuratedTemplates.CreateTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :create], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :create], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "creates each resource type without publishing or creating real resources", ctx do
      for type <- [:kpi, :goal, :project] do
        inputs = payload(type)
        assert {200, %{template: returned, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :create], inputs)
        assert returned.state == "draft"
        {:ok, record} = OperatelyEE.AdminApi.CuratedTemplates.Shared.load(returned.id)
        assert record.creator_account_id == ctx.account.id
        assert record.updater_account_id == ctx.account.id
        assert record.definition["name"] == Operately.Support.Factory.CuratedTemplates.definition(type)["name"]
      end
    end

    test "allows incomplete drafts and reports invalid fields", ctx do
      assert {200, %{template: template, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :create], %{payload(:kpi) | definition: "{}"})
      assert template.state == "draft"
      inputs = %{payload(:project) | definition: Jason.encode!(%{tasks: [%{key: "t", milestone_key: "missing"}]})}
      assert {200, %{template: nil, errors: errors}} = admin_mutation(ctx.conn, [:curated_templates, :create], inputs)
      assert Enum.any?(errors, &(&1.path == "definition.tasks.0.milestone_key"))
    end
  end

  defp payload(type) do
    %{title: "Example", type: Atom.to_string(type), content_language: "en", definition: Jason.encode!(Operately.Support.Factory.CuratedTemplates.definition(type))}
  end
end
