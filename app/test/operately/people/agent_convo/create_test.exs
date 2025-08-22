defmodule Operately.People.AgentConvo.CreateTest do
  use Operately.DataCase

  alias Operately.People.AgentConvo
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space)
  end

  test "creates conversation with project context as ID reference", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, convo} = AgentConvo.create(ctx.creator, "evaluate-project-definition", :project, ctx.project.id)

      assert convo.project_id == ctx.project.id
      assert convo.author_id == ctx.creator.id
      assert convo.title == "Evaluate project definition"

      # Verify messages are created
      convo = AgentConvo.preload_user_facing_messages(convo)

      # user message and response placeholder
      assert length(convo.messages) == 2

      # Find the user message that contains the context
      user_message = Enum.find(convo.messages, fn msg -> msg.source == :user end)
      assert user_message

      # Verify that the project context is passed as an ID reference
      project_id_encoded = Operately.ShortUuid.encode!(ctx.project.id)
      assert user_message.prompt =~ project_id_encoded
      assert user_message.prompt =~ "get_project_details tool"
    end)
  end

  test "creates conversation with goal context as ID reference", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, convo} = AgentConvo.create(ctx.creator, "evaluate-goal-definition", :goal, ctx.goal.id)

      assert convo.goal_id == ctx.goal.id
      assert convo.author_id == ctx.creator.id
      assert convo.title == "Evaluate goal definition"

      # Verify messages are created
      convo = AgentConvo.preload_user_facing_messages(convo)

      # user message and response placeholder
      assert length(convo.messages) == 2

      # Find the user message that contains the context
      user_message = Enum.find(convo.messages, fn msg -> msg.source == :user end)
      assert user_message

      # Verify that the goal context is passed as an ID reference
      goal_id_encoded = Operately.ShortUuid.encode!(ctx.goal.id)
      assert user_message.prompt =~ goal_id_encoded
      assert user_message.prompt =~ "get_goal_details tool"
    end)
  end
end
