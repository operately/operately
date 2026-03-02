defmodule OperatelyWeb.Api.ExternalMutations.AuthTest do
  use OperatelyWeb.TurboCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Api.ExternalMutations.Coverage
  alias Plug.Conn

  @validation Coverage.validate_specs()
  @mutation_rows Coverage.build_mutation_rows(@validation.mutation_rows)

  describe "mutation spec coverage" do
    test "all external mutations have valid specs" do
      assert Enum.empty?(@validation.missing_rows), "Missing specs: #{inspect(@validation.missing_rows)}"
      assert Enum.empty?(@validation.extra_rows), "Extra specs: #{inspect(@validation.extra_rows)}"
      assert Enum.empty?(@validation.invalid_rows), "Invalid specs: #{inspect(@validation.invalid_rows)}"
      assert length(@validation.mutation_rows) > 0, "No mutation specs found"
    end

    for row <- @validation.missing_rows do
      mutation_name = row.mutation_name

      test "missing external auth spec for #{mutation_name}" do
        flunk "Missing external mutation auth spec for #{unquote(mutation_name)}"
      end
    end

    for row <- @validation.extra_rows do
      mutation_name = row.mutation_name

      test "spec exists for removed mutation #{mutation_name}" do
        flunk "External mutation auth spec exists for unknown mutation #{unquote(mutation_name)}"
      end
    end

    for row <- @validation.invalid_rows do
      mutation_name = row.mutation_name
      reasons = Enum.join(row.reasons, "; ")

      test "invalid external auth spec for #{mutation_name}" do
        flunk "Invalid external mutation auth spec for #{unquote(mutation_name)}: #{unquote(reasons)}"
      end
    end
  end

  describe "auth scenarios" do
    for row <- @mutation_rows do
      test "#{row.mutation_name} / external_without_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)

        {status, response} = external_mutation(ctx.conn, nil, row.mutation_name, inputs)
        assert_unauthorized(status, response)
      end

      test "#{row.mutation_name} / external_with_session", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.log_in_person(ctx, :creator)

        {status, response} = external_mutation(ctx.conn, nil, row.mutation_name, inputs)
        assert_unauthorized(status, response)
      end

      test "#{row.mutation_name} / internal_with_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: true)
        conn = Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.api_token}")

        {status, response} = mutation(conn, row.mutation_name, inputs)
        assert_unauthorized(status, response)
      end

      test "#{row.mutation_name} / external_read_only_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: true)

        {status, response} = external_mutation(ctx.conn, ctx.api_token, row.mutation_name, inputs)
        assert_read_only_forbidden(status, response)
      end

      test "#{row.mutation_name} / external_full_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: false)

        assert {200, response} = external_mutation(ctx.conn, ctx.api_token, row.mutation_name, inputs)
        row.assert_fn.(response, ctx)
      end
    end
  end

  defp assert_unauthorized(status, response) do
    assert status == 401
    assert response == "Unauthorized"
  end

  defp assert_read_only_forbidden(status, response) do
    assert status == 403
    assert response == "Read-only API tokens cannot execute mutations"
  end

  defp resolve_inputs(inputs, ctx) when is_function(inputs, 1), do: inputs.(ctx)
  defp resolve_inputs(inputs, _ctx) when is_map(inputs), do: inputs
end
