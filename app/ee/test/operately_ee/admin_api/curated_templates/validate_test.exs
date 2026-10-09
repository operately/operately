defmodule OperatelyEE.AdminApi.CuratedTemplates.ValidateTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :validate], %{})
    end

    test "requires a site admin", ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, [:curated_templates, :validate], %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
      ctx |> Map.put(:account, account) |> Factory.log_in_account(:account)
    end

    test "validates all content without writing", ctx do
      for type <- [:kpi, :goal, :project] do
        assert {200, %{valid: true, errors: []}} = admin_mutation(ctx.conn, [:curated_templates, :validate], payload(type))
      end

      assert Repo.aggregate(Operately.CuratedTemplates.Template, :count) == 0
    end

    test "returns nested errors for incomplete content", ctx do
      inputs = %{payload(:goal) | definition: Jason.encode!(%{name: "Goal", targets: [%{name: "Target"}]})}
      assert {200, %{valid: false, errors: errors}} = admin_mutation(ctx.conn, [:curated_templates, :validate], inputs)
      assert Enum.any?(errors, &(&1.path == "definition.targets.0.unit"))
    end
  end

  defp payload(type) do
    %{
      title: "Example",
      type: Atom.to_string(type),
      content_language: "en",
      definition: Jason.encode!(Map.put(Operately.Support.Factory.CuratedTemplates.definition(type), "description", Operately.Support.RichText.curated_template_content()))
    }
  end
end
