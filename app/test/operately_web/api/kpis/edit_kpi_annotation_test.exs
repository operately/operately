defmodule OperatelyWeb.Api.Kpis.EditKpiAnnotationTest do
  use OperatelyWeb.TurboCase

  import Operately.KpisFixtures
  import Ecto.Query
  import Mock

  alias Operately.Kpis
  alias Operately.Activities.Activity

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], %{})
    end
  end

  describe "edit_kpi_annotation" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_space_member(:member, :space)
        |> Factory.add_company_member(:outsider)

      kpi = kpi_fixture(ctx.creator, space_id: ctx.space.id)
      annotation = kpi_annotation_fixture(ctx.creator, kpi)
      ctx |> Map.put(:kpi, kpi) |> Map.put(:annotation, annotation)
    end

    test "any space member can edit an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      inputs = %{
        annotation_id: Paths.kpi_annotation_id(ctx.annotation),
        title: "Pricing change",
        date: "2026-04-01"
      }

      assert {200, res} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
      assert res.annotation.title == "Pricing change"
      assert res.annotation.date == "2026-04-01"
      assert Kpis.get_annotation(ctx.annotation.id).title == "Pricing change"
    end

    test "invalid titles return bad request without changing annotations or adding activities", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      for title <- [String.duplicate("a", 81), "", " \t\n "] do
        inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation), date: "2026-04-01", title: title}

        assert {400, _} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
        annotation = Kpis.get_annotation(ctx.annotation.id)
        assert annotation.title == ctx.annotation.title
        assert annotation.date == ctx.annotation.date
        refute Repo.exists?(from(a in Activity, where: a.action == "kpi_annotation_edited" and a.content["annotation_id"] == ^ctx.annotation.id))
      end
    end

    test "transaction failures outside annotation validation return internal server error", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation), title: "Pricing change"}

      with_mock Operately.Operations.KpiAnnotationEditing, run: fn _, _, _, _ -> {:error, :activity, %Ecto.Changeset{}, %{}} end do
        assert {500, _} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
      end
    end

    test "accepts an 80-character title after trimming and preserves the omitted date", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      title = String.duplicate("a", 80)
      inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation), title: "  #{title}  "}

      assert {200, res} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
      assert res.annotation.title == title
      annotation = Kpis.get_annotation(ctx.annotation.id)
      assert annotation.title == title
      assert annotation.date == ctx.annotation.date
    end

    test "editing only the date preserves the omitted title", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation), date: "2026-04-01"}

      assert {200, res} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
      assert res.annotation.date == "2026-04-01"
      assert res.annotation.title == ctx.annotation.title
      annotation = Kpis.get_annotation(ctx.annotation.id)
      assert annotation.date == ~D[2026-04-01]
      assert annotation.title == ctx.annotation.title
    end

    test "a non-space-member cannot edit an annotation", ctx do
      ctx = Factory.log_in_person(ctx, :outsider)

      inputs = %{annotation_id: Paths.kpi_annotation_id(ctx.annotation), title: "Pricing change"}
      assert {404, _} = mutation(ctx.conn, [:kpis, :edit_kpi_annotation], inputs)
      assert Kpis.get_annotation(ctx.annotation.id).title == ctx.annotation.title
    end
  end
end
