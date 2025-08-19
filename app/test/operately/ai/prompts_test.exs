defmodule Operately.Ai.PromptsTest do
  use ExUnit.Case, async: true

  alias Operately.Ai.Prompts

  setup do
    Prompts.start_link()
    :ok
  end

  test "system prompt returns the correct value" do
    system_prompt = Prompts.system_prompt()
    assert String.starts_with?(system_prompt, "You are Alfred, the AI COO running within Operately")
  end

  test "find_action returns the correct action" do
    assert {:ok, action} = Prompts.find_action("goal", "evaluate-goal-definition")
    assert action.id == "evaluate-goal-definition"
    assert String.contains?(action.prompt, "critically evaluate its clarity")
  end

  test "find_action returns error for non-existing action" do
    assert {:error, :not_found} = Prompts.find_action("goal", "non_existing_action")
  end

  describe "when OPERATELY_AI_PROMPTS_FILE_PATH environment variable is set" do
    setup do
      System.put_env("OPERATELY_AI_PROMPTS_FILE_PATH", "test/fixtures/test_prompts.yaml")
      Prompts.reload()

      on_exit(fn ->
        System.delete_env("OPERATELY_AI_PROMPTS_FILE_PATH")
        Prompts.reload()
      end)

      :ok
    end

    test "system prompt loads from custom file" do
      assert Prompts.system_prompt() == "This is a test system prompt from environment variable."
    end

    test "find_action returns action from custom file" do
      assert {:ok, action} = Prompts.find_action("project", "test-env-action")
      assert action.id == "test-env-action"
      assert action.context == "project"
      assert action.prompt == "This is a test prompt loaded from environment variable."
    end

    test "find_action works with different context from custom file" do
      assert {:ok, action} = Prompts.find_action("goal", "another-env-action")
      assert action.id == "another-env-action"
      assert action.context == "goal"
      assert action.prompt == "Another test prompt from custom file."
    end

    test "find_action returns error for non-existing action in custom file" do
      assert {:error, :not_found} = Prompts.find_action("test_context", "non_existing_action")
    end

    test "find_action returns error for wrong context in custom file" do
      assert {:error, :not_found} = Prompts.find_action("wrong_context", "test_env_action")
    end

    test "loads different content than default prompts file" do
      # Verify that we're not loading the default content anymore
      refute String.starts_with?(Prompts.system_prompt(), "You are Alfred, the AI COO running within Operately")

      # Verify we can't find actions that exist in the default file
      assert {:error, :not_found} = Prompts.find_action("goal", "evaluate-goal-definition")
    end
  end
end
