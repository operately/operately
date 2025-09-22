# Test Goal acknowledgement logic to see if they have the same self-acknowledgement issue
defmodule TestGoalPermissions do
  defstruct [:author_id, :goal]
  
  defmodule TestGoal do
    defstruct [:champion_id, :reviewer_id]
  end
  
  # Goal logic from the codebase
  def can_acknowledge(update, user_id) do
    goal = update.goal

    cond do
      update.author_id == goal.champion_id && goal.reviewer_id == user_id -> true
      update.author_id == goal.reviewer_id && goal.champion_id == user_id -> true
      true -> user_id == goal.reviewer_id
    end
  end
  
  # Test scenarios
  def test_scenarios() do
    goal = %TestGoal{champion_id: "champion_id", reviewer_id: "reviewer_id"}
    
    # Test: Reviewer posts their own update, can they acknowledge?
    update = %TestGoalPermissions{author_id: "reviewer_id", goal: goal}
    IO.puts("Goal: Reviewer acknowledges own: #{can_acknowledge(update, "reviewer_id")}")
    
    # Test: Champion posts their own update, can they acknowledge?
    update2 = %TestGoalPermissions{author_id: "champion_id", goal: goal}
    IO.puts("Goal: Champion acknowledges own: #{can_acknowledge(update2, "champion_id")}")
  end
end

TestGoalPermissions.test_scenarios()