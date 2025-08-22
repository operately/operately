defmodule Operately.People.AgentConvo.CreateTest do
  use Operately.DataCase

  alias Operately.People.AgentConvo
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  describe "run/4" do
    test "creates conversation with goal context as ID reference, not pre-rendered markdown", ctx do
      {:ok, convo} = AgentConvo.create(ctx.creator, "evaluate-goal-definition", :goal, ctx.goal.id)
      
      # Verify conversation is created
      assert convo.goal_id == ctx.goal.id
      assert convo.author_id == ctx.creator.id
      assert convo.title == "Evaluate goal definition"
      
      # Verify messages are created
      convo = AgentConvo.preload_user_facing_messages(convo)
      assert length(convo.messages) == 2  # user message and response placeholder
      
      # Find the user message that contains the context
      user_message = Enum.find(convo.messages, fn msg -> msg.source == :user end)
      assert user_message
      
      # Verify that the goal context is now passed as an ID reference, not pre-rendered markdown
      goal_id_encoded = Operately.ShortUuid.encode!(ctx.goal.id)
      assert user_message.prompt =~ goal_id_encoded
      assert user_message.prompt =~ "get_goal_details tool"
      
      # Verify it does NOT contain pre-rendered goal markdown (which would include the goal name)
      refute user_message.prompt =~ ctx.goal.name
    end
    
    test "creates conversation with project context as ID reference (existing behavior)", ctx do
      ctx = Factory.add_project(ctx, :project, :space)
      
      {:ok, convo} = AgentConvo.create(ctx.creator, "evaluate-project-definition", :project, ctx.project.id)
      
      # Verify conversation is created
      assert convo.project_id == ctx.project.id
      assert convo.author_id == ctx.creator.id
      
      # Verify the project context also uses ID reference (existing behavior)
      convo = AgentConvo.preload_user_facing_messages(convo)
      user_message = Enum.find(convo.messages, fn msg -> msg.source == :user end)
      
      project_id_encoded = Operately.ShortUuid.encode!(ctx.project.id)
      assert user_message.prompt =~ project_id_encoded
    end
  end
end