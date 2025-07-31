defmodule Operately.AI.ToolsTest do
  use Operately.DataCase

  alias Operately.AI.Tools
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:product)
  end

  describe "post_goal_message/0" do
    setup ctx do
      ctx
      |> Factory.add_goal(:goal, :product)
      |> Factory.add_company_agent(:agent)
      |> then(fn ctx ->
        agent = Operately.Repo.preload(ctx.agent, :agent_def)
        {:ok, agent_run} = Operately.People.AgentRun.create(agent.agent_def, false)
        Map.put(ctx, :agent_run, agent_run)
      end)
    end

    test "posts a message to the goal", ctx do
      tool = Tools.post_goal_message()
      context = %{person: ctx.creator, agent_run: ctx.agent_run}
      args = %{"goal_id" => ctx.goal.id, "title" => "Test Message", "message" => "This is a test message."}

      assert {:ok, result} = tool.function.(args, context)
      assert {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(Jason.decode!(result)["id"])
      assert message = Operately.Activities.get_activity(id) |> Repo.preload(:comment_thread)
      assert message.comment_thread.title == "Test Message"
    end
  end

  describe "post_project_message/0" do
    setup ctx do
      ctx
      |> Factory.add_project(:project, :product)
      |> Factory.add_company_agent(:agent)
      |> then(fn ctx ->
        agent = Operately.Repo.preload(ctx.agent, :agent_def)
        {:ok, agent_run} = Operately.People.AgentRun.create(agent.agent_def, false)
        Map.put(ctx, :agent_run, agent_run)
      end)
    end

    test "posts a message to the project", ctx do
      tool = Tools.post_project_message()
      context = %{person: ctx.creator, agent_run: ctx.agent_run}
      id = OperatelyWeb.Paths.project_id(ctx.project)
      args = %{"project_id" => id, "title" => "Test Message", "message" => "This is a test message."}

      assert {:ok, result} = tool.function.(args, context)
      assert {:ok, _id} = OperatelyWeb.Api.Helpers.decode_id(Jason.decode!(result)["discussion"]["id"])
    end
  end
end
