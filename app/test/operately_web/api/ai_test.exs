defmodule OperatelyWeb.Api.AiTest do
  use OperatelyWeb.TurboCase
  import Mock

  setup_with_mocks([{Operately.AI, [], [run: fn _person, _prompt -> {:ok, "Mocked AI response"} end]}]) do
    :ok
  end

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("ai")
  end

  describe "prompt" do
    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:ai, :prompt], %{prompt: "Hello"})
    end

    test "returns result for valid prompt", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:ai, :prompt], %{prompt: "Hello"})
      assert res.result == "Mocked AI response"
    end

    test "returns error if feature is not enabled", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.disable_feature(ctx, "ai")

      assert {404, _} = query(ctx.conn, [:ai, :prompt], %{prompt: "Hello"})
    end
  end

  describe "ListAgents mutation" do
    setup ctx do
      Factory.add_company_agent(ctx, :coo, title: "Agent 1", full_name: "Agent One", definition: "Definition 1")
    end

    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:ai, :list_agents], %{})
    end

    test "returns agents for authenticated user", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:ai, :list_agents], %{})
      assert is_list(res.agents)
      assert length(res.agents) == 1
    end
  end

  describe "add_agent mutation" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:ai, :add_agent], %{title: "Agent", full_name: "Agent Name"})
    end

    test "adds agent for authenticated user", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      params = %{title: "Agent", full_name: "Agent Name"}
      assert {200, res} = mutation(ctx.conn, [:ai, :add_agent], params)
      assert res.success == true
    end
  end
end
