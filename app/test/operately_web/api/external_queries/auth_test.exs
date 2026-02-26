defmodule OperatelyWeb.Api.ExternalQueries.AuthTest do
  use OperatelyWeb.TurboCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Api.ExternalQueries.Coverage
  alias Plug.Conn

  @validation Coverage.validate_specs()
  @query_rows Coverage.build_query_rows(@validation.query_rows)

  # describe "query spec coverage" do
  #   for row <- @validation.missing_rows do
  #     query_name = row.query_name

  #     test "missing external auth spec for #{query_name}" do
  #       flunk "Missing external query auth spec for #{unquote(query_name)}"
  #     end
  #   end

  #   for row <- @validation.extra_rows do
  #     query_name = row.query_name

  #     test "spec exists for removed query #{query_name}" do
  #       flunk "External query auth spec exists for unknown query #{unquote(query_name)}"
  #     end
  #   end

  #   for row <- @validation.invalid_rows do
  #     query_name = row.query_name
  #     reasons = Enum.join(row.reasons, "; ")

  #     test "invalid external auth spec for #{query_name}" do
  #       flunk "Invalid external query auth spec for #{unquote(query_name)}: #{unquote(reasons)}"
  #     end
  #   end
  # end

  describe "auth scenarios" do
    for row <- @query_rows do
      test "#{row.query_name} / external_without_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)

        {status, response} = external_query(ctx.conn, nil, row.query_name, inputs)
        assert_unauthorized(status, response)
      end

      test "#{row.query_name} / external_with_session", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.log_in_person(ctx, :creator)

        {status, response} = external_query(ctx.conn, nil, row.query_name, inputs)
        assert_unauthorized(status, response)
      end

      test "#{row.query_name} / internal_with_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: true)
        conn = Conn.put_req_header(ctx.conn, "authorization", "Bearer #{ctx.api_token}")

        {status, response} = query(conn, row.query_name, inputs)
        assert_unauthorized(status, response)
      end

      test "#{row.query_name} / external_read_only_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: true)

        assert {200, response} = external_query(ctx.conn, ctx.api_token, row.query_name, inputs)
        row.assert_fn.(response, ctx)
      end

      test "#{row.query_name} / external_full_token", ctx do
        row = unquote(Macro.escape(row))
        ctx = row.setup.(ctx)
        inputs = resolve_inputs(row.inputs, ctx)
        ctx = Factory.add_api_token(ctx, :api_token, :creator, read_only: false)

        assert {200, response} = external_query(ctx.conn, ctx.api_token, row.query_name, inputs)
        row.assert_fn.(response, ctx)
      end
    end
  end

  defp assert_unauthorized(status, response) do
    assert status == 401
    assert response == "Unauthorized"
  end

  defp resolve_inputs(inputs, ctx) when is_function(inputs, 1), do: inputs.(ctx)
  defp resolve_inputs(inputs, _ctx) when is_map(inputs), do: inputs
  defp resolve_inputs(nil, _ctx), do: %{}
end
