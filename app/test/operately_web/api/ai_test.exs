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
      Factory.add_company_agent(ctx, :coo, title: "Agent 1", full_name: "Agent One")
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

  describe "get_agent query" do
    setup ctx do
      Factory.add_company_agent(ctx, :agent, title: "Agent 1", full_name: "Agent One")
    end

    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:ai, :get_agent], %{id: Ecto.UUID.generate()})
    end

    test "return 404 if agent not found", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = query(ctx.conn, [:ai, :get_agent], %{id: Ecto.UUID.generate()})
    end

    test "returns agent details for existing agent", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:ai, :get_agent], %{id: OperatelyWeb.Paths.person_id(ctx.agent)})
      assert res.agent.title == "Agent 1"
      assert res.agent.full_name == "Agent One"
    end
  end

  describe "edit_agent_definition mutation" do
    setup ctx do
      Factory.add_company_agent(ctx, :agent, title: "Agent 1", full_name: "Agent One")
    end

    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:ai, :edit_agent_definition], %{id: Ecto.UUID.generate(), definition: "New Definition"})
    end

    test "returns 404 if agent not found", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:ai, :edit_agent_definition], %{id: Ecto.UUID.generate(), definition: "New Definition"})
    end

    test "updates agent definition for existing agent", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      agent_id = OperatelyWeb.Paths.person_id(ctx.agent)

      assert {200, res} = mutation(ctx.conn, [:ai, :edit_agent_definition], %{id: agent_id, definition: "New Definition"})
      assert res.success == true

      # Verify the agent was updated
      assert {200, res} = query(ctx.conn, [:ai, :get_agent], %{id: agent_id})
      assert res.agent.agent_def.definition == "New Definition"
    end
  end

  describe "edit_agent_verbosity" do
    setup ctx do
      Factory.add_company_agent(ctx, :agent, title: "Agent 1", full_name: "Agent One")
    end

    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:ai, :edit_agent_verbosity], %{id: Ecto.UUID.generate(), verbose: true})
    end

    test "returns 404 if agent not found", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:ai, :edit_agent_verbosity], %{id: Ecto.UUID.generate(), verbose: true})
    end

    test "updates agent verbosity for existing agent", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      agent_id = OperatelyWeb.Paths.person_id(ctx.agent)

      assert {200, res} = mutation(ctx.conn, [:ai, :edit_agent_verbosity], %{id: agent_id, verbose: true})
      assert res.success == true

      # Verify the agent verbosity was updated
      assert {200, res} = query(ctx.conn, [:ai, :get_agent], %{id: agent_id})
      assert res.agent.agent_def.verbose_logs == true
    end
  end

  describe "edit_agent_provider" do
    setup ctx do
      Factory.add_company_agent(ctx, :agent, title: "Agent 1", full_name: "Agent One")
    end

    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:ai, :edit_agent_provider], %{id: Ecto.UUID.generate(), provider: "openai"})
    end

    test "returns 404 if agent not found", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {404, _} = mutation(ctx.conn, [:ai, :edit_agent_provider], %{id: Ecto.UUID.generate(), provider: "openai"})
    end

    test "updates agent provider for existing agent", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      agent_id = OperatelyWeb.Paths.person_id(ctx.agent)

      assert {200, res} = mutation(ctx.conn, [:ai, :edit_agent_provider], %{id: agent_id, provider: "claude"})
      assert res.success == true

      # Verify the agent provider was updated
      assert {200, res} = query(ctx.conn, [:ai, :get_agent], %{id: agent_id})
      assert res.agent.agent_def.provider == "claude"
    end
  end

  describe "create_conversation" do
    setup ctx do
      Factory.add_company_agent(ctx, :agent, title: "Agent 1", full_name: "Agent One")
    end

    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:ai, :create_conversation], %{})
    end

    test "it requires a valid context type", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, _} = mutation(ctx.conn, [:ai, :create_conversation], %{context_id: Ecto.UUID.generate()})
    end

    test "it requires a valid context id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {400, _} = mutation(ctx.conn, [:ai, :create_conversation], %{context_type: "goal"})
    end
  end

  describe "get_conversations" do
    setup ctx do
      Factory.add_company_agent(ctx, :agent, title: "Agent 1", full_name: "Agent One")
    end

    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:ai, :get_conversations], %{})
    end

    test "returns empty list when no conversations exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      assert {200, res} = query(ctx.conn, [:ai, :get_conversations], %{})
      assert res.conversations == []
    end

    test "returns all conversations when no context is provided", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal(ctx, :goal1, :marketing)
      ctx = Factory.add_goal(ctx, :goal2, :marketing)
      
      # Create conversations for both goals
      {:ok, _convo1} = Operately.People.AgentConvo.create(ctx.creator, "analyze_goal", :goal, ctx.goal1.id)
      {:ok, _convo2} = Operately.People.AgentConvo.create(ctx.creator, "analyze_goal", :goal, ctx.goal2.id)

      assert {200, res} = query(ctx.conn, [:ai, :get_conversations], %{})
      assert length(res.conversations) == 2
    end

    test "filters conversations by goal context", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal(ctx, :goal1, :marketing)
      ctx = Factory.add_goal(ctx, :goal2, :marketing)
      
      # Create conversations for both goals
      {:ok, _convo1} = Operately.People.AgentConvo.create(ctx.creator, "analyze_goal", :goal, ctx.goal1.id)
      {:ok, _convo2} = Operately.People.AgentConvo.create(ctx.creator, "analyze_goal", :goal, ctx.goal2.id)

      # Query with goal1 context should only return conversations for goal1
      assert {200, res} = query(ctx.conn, [:ai, :get_conversations], %{
        context_type: "goal", 
        context_id: OperatelyWeb.Paths.goal_id(ctx.goal1)
      })
      assert length(res.conversations) == 1
      
      # Query with goal2 context should only return conversations for goal2
      assert {200, res} = query(ctx.conn, [:ai, :get_conversations], %{
        context_type: "goal", 
        context_id: OperatelyWeb.Paths.goal_id(ctx.goal2)
      })
      assert length(res.conversations) == 1
    end

    test "filters conversations by project context", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_project(ctx, :project1, :marketing)
      ctx = Factory.add_project(ctx, :project2, :marketing)
      
      # Create conversations for both projects
      {:ok, _convo1} = Operately.People.AgentConvo.create(ctx.creator, "analyze_project", :project, ctx.project1.id)
      {:ok, _convo2} = Operately.People.AgentConvo.create(ctx.creator, "analyze_project", :project, ctx.project2.id)

      # Query with project1 context should only return conversations for project1
      assert {200, res} = query(ctx.conn, [:ai, :get_conversations], %{
        context_type: "project", 
        context_id: OperatelyWeb.Paths.project_id(ctx.project1)
      })
      assert length(res.conversations) == 1
      
      # Query with project2 context should only return conversations for project2
      assert {200, res} = query(ctx.conn, [:ai, :get_conversations], %{
        context_type: "project", 
        context_id: OperatelyWeb.Paths.project_id(ctx.project2)
      })
      assert length(res.conversations) == 1
    end

    test "returns empty list when context has no conversations", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      ctx = Factory.add_goal(ctx, :goal1, :marketing)
      ctx = Factory.add_goal(ctx, :goal2, :marketing)
      
      # Create conversation for goal1 only
      {:ok, _convo1} = Operately.People.AgentConvo.create(ctx.creator, "analyze_goal", :goal, ctx.goal1.id)

      # Query with goal2 context should return empty list
      assert {200, res} = query(ctx.conn, [:ai, :get_conversations], %{
        context_type: "goal", 
        context_id: OperatelyWeb.Paths.goal_id(ctx.goal2)
      })
      assert res.conversations == []
    end
  end
end
