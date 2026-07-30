defmodule OperatelyWeb.Api.Spaces.KpisTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Kpis.{Kpi, DataPoint}

  describe "security" do
    test "create_kpi requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:spaces, :create_kpi], %{})
    end
  end

  describe "create_kpi permissions" do
    @table [
      %{permissions: :view_access, expected: 403},
      %{permissions: :comment_access, expected: 403},
      %{permissions: :edit_access, expected: 200},
      %{permissions: :full_access, expected: 200}
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "company member with #{@test.permissions} can #{if @test.expected == 200, do: "create", else: "not create"} a kpi", ctx do
        ctx = Factory.add_space(ctx, :space, company_permissions: Binding.from_atom(@test.permissions))

        assert {code, res} =
                 mutation(ctx.conn, [:spaces, :create_kpi], %{
                   space_id: Paths.space_id(ctx.space),
                   name: "Revenue"
                 })

        assert code == @test.expected

        case @test.expected do
          200 -> assert res.kpi.name == "Revenue"
          403 -> assert res.message == "You don't have permission to perform this action"
        end
      end
    end
  end

  describe "kpi mutations" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.enable_space_tool(:space, :kpis)
    end

    test "create_kpi persists the kpi", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:spaces, :create_kpi], %{
                 space_id: Paths.space_id(ctx.space),
                 name: "Revenue",
                 unit: "currency",
                 target: 1_000_000.0,
                 target_direction: "above"
               })

      assert res.kpi.name == "Revenue"
      assert res.kpi.target == 1_000_000.0
      assert Repo.aggregate(Kpi, :count) == 1
    end

    test "create_kpi returns validation errors from the operation layer", ctx do
      assert {400, res} =
               mutation(ctx.conn, [:spaces, :create_kpi], %{
                 space_id: Paths.space_id(ctx.space),
                 name: ""
               })

      assert res.message =~ "name"
      assert Repo.aggregate(Kpi, :count) == 0
    end

    test "update_kpi changes fields", ctx do
      ctx = Factory.add_kpi(ctx, :kpi, :space, name: "Revenue")

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :update_kpi], %{
                 kpi_id: Operately.ShortUuid.encode!(ctx.kpi.id),
                 name: "Net Revenue"
               })

      assert res.kpi.name == "Net Revenue"
      assert Repo.get(Kpi, ctx.kpi.id).name == "Net Revenue"
    end

    test "delete_kpi removes the kpi", ctx do
      ctx = Factory.add_kpi(ctx, :kpi, :space, name: "Revenue")

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :delete_kpi], %{
                 kpi_id: Operately.ShortUuid.encode!(ctx.kpi.id)
               })

      assert res.success
      refute Repo.get(Kpi, ctx.kpi.id)
    end

    test "add_kpi_data_point and update_kpi_data_point", ctx do
      ctx = Factory.add_kpi(ctx, :kpi, :space, name: "Revenue")

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :add_kpi_data_point], %{
                 kpi_id: Operately.ShortUuid.encode!(ctx.kpi.id),
                 value: 100.0,
                 recorded_for: "2026-01-01"
               })

      assert res.data_point.value == 100.0
      data_point = Repo.one(DataPoint)
      assert data_point.kpi_id == ctx.kpi.id

      assert {200, res} =
               mutation(ctx.conn, [:spaces, :update_kpi_data_point], %{
                 data_point_id: Operately.ShortUuid.encode!(data_point.id),
                 value: 250.0
               })

      assert res.data_point.value == 250.0
      assert Repo.get(DataPoint, data_point.id).value == 250.0
    end
  end
end
