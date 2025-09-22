# Simple test script to verify the permission logic
defmodule TestPermissions do
  defstruct [:author_id, :project]
  
  defmodule TestProject do
    defstruct [:champion, :reviewer]
  end
  
  defmodule TestPerson do
    defstruct [:id]
  end
  
  def can_acknowledge_check_in(check_in, user_id) do
    project = check_in.project

    # Similar logic to Goals: 
    # - If champion posts check-in, reviewer can acknowledge
    # - If reviewer posts check-in, champion can acknowledge  
    # - Users cannot acknowledge their own check-ins
    # - Otherwise, only reviewer can acknowledge (existing behavior)
    cond do
      # Prevent self-acknowledgement
      check_in.author_id == user_id -> false
      # Champion posted, reviewer can acknowledge
      check_in.author_id == get_champion_id(project) && get_reviewer_id(project) == user_id -> true
      # Reviewer posted, champion can acknowledge
      check_in.author_id == get_reviewer_id(project) && get_champion_id(project) == user_id -> true
      # For all other cases, only reviewer can acknowledge
      true -> user_id == get_reviewer_id(project)
    end
  end

  defp get_champion_id(project) do
    case project.champion do
      nil -> nil
      champion -> champion.id
    end
  end

  defp get_reviewer_id(project) do
    case project.reviewer do
      nil -> nil
      reviewer -> reviewer.id
    end
  end
  
  # Test scenarios
  def test_scenarios() do
    champion = %TestPerson{id: "champion_id"}
    reviewer = %TestPerson{id: "reviewer_id"}
    other = %TestPerson{id: "other_id"}
    
    project = %TestProject{champion: champion, reviewer: reviewer}
    
    # Test 1: Champion posts, reviewer can acknowledge
    check_in1 = %TestPermissions{author_id: "champion_id", project: project}
    IO.puts("Champion posts, reviewer acknowledges: #{can_acknowledge_check_in(check_in1, "reviewer_id")}")
    
    # Test 2: Reviewer posts, champion can acknowledge  
    check_in2 = %TestPermissions{author_id: "reviewer_id", project: project}
    IO.puts("Reviewer posts, champion acknowledges: #{can_acknowledge_check_in(check_in2, "champion_id")}")
    
    # Test 3: Champion can't acknowledge own check-in
    IO.puts("Champion acknowledges own: #{can_acknowledge_check_in(check_in1, "champion_id")}")
    
    # Test 4: Reviewer can't acknowledge own check-in
    IO.puts("Reviewer acknowledges own: #{can_acknowledge_check_in(check_in2, "reviewer_id")}")
    
    # Test 5: Other person posts, only reviewer can acknowledge
    check_in3 = %TestPermissions{author_id: "other_id", project: project}
    IO.puts("Other posts, reviewer acknowledges: #{can_acknowledge_check_in(check_in3, "reviewer_id")}")
    IO.puts("Other posts, champion acknowledges: #{can_acknowledge_check_in(check_in3, "champion_id")}")
    IO.puts("Other posts, other acknowledges: #{can_acknowledge_check_in(check_in3, "other_id")}")
  end
end

TestPermissions.test_scenarios()