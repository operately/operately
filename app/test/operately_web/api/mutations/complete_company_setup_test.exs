defmodule OperatelyWeb.Api.Mutations.CompleteCompanySetupTest do
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias Operately.Groups

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:member)
  end

  describe "authentication and permissions" do
    test "requires authentication", ctx do
      assert {401, _} = request(ctx.conn, [%{name: "Marketing", description: "All go-to-market work"}])
    end

    test "denies non-owner members", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {403, res} = request(ctx.conn, [%{name: "Marketing", description: "All go-to-market work"}])
      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "company setup completion" do
    setup :log_in_creator

    test "completes setup without creating new spaces", ctx do
      assert {200, %{}} = request(ctx.conn, [])

      company = Repo.reload(ctx.company)
      assert company.setup_completed
    end

    test "creates requested spaces and marks company as completed", ctx do
      spaces = [
        %{name: "Marketing", description: "All go-to-market work"},
        %{name: "Design", description: "Product and brand design"}
      ]

      assert {200, %{}} = request(ctx.conn, spaces)

      company = Repo.reload(ctx.company)
      assert company.setup_completed

      marketing = Groups.get_group_by_name("Marketing")
      design = Groups.get_group_by_name("Design")

      assert marketing
      assert marketing.mission == "All go-to-market work"
      assert design
      assert design.mission == "Product and brand design"
    end

    test "cannot be executed more than once", ctx do
      spaces = [%{name: "Marketing", description: "All go-to-market work"}]
      assert {200, %{}} = request(ctx.conn, spaces)
      assert {400, _} = request(ctx.conn, [%{name: "Sales", description: "Revenue operations"}])

      company = Repo.reload(ctx.company)
      assert company.setup_completed
      refute Groups.get_group_by_name("Sales")
    end

    test "rejects spaces without descriptions", ctx do
      assert {400, _} = request(ctx.conn, [%{name: "Marketing", description: ""}])

      company = Repo.reload(ctx.company)
      refute company.setup_completed
    end
  end

  #
  # Helpers
  #

  defp request(conn, spaces) do
    mutation(conn, :complete_company_setup, %{spaces: spaces})
  end

  defp log_in_creator(ctx) do
    {:ok, Factory.log_in_person(ctx, :creator)}
  end
end
