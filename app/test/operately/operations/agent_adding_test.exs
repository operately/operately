defmodule Operately.Operations.AgentAddingTest do
  use Operately.DataCase, async: true

  alias Operately.Repo
  alias Operately.People.AgentDef
  alias Operately.Operations.AgentAdding
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
  end

  test "adding an AI agent", ctx do
    attrs = %{
      title: "Chief Operating Officer (COO)",
      full_name: "Alfred Iverson",
      definition: """
      You are a COO of the company. Your task is to verify if the goal is well defined and actionable.
      Please review the goal and if it is not well defined, provide a detailed explanation of what is missing or needs
      to be changed. The feedback should be actionable and specific. Submit the feedback as a markdown message
      to the goal.
      """
    }

    {:ok, person} = AgentAdding.run(ctx.creator, attrs)

    assert person.full_name == "Alfred Iverson"
    assert person.title == "Chief Operating Officer (COO)"
    assert person.type == :ai

    agent_def = Repo.get_by!(AgentDef, person_id: person.id)
    assert agent_def.definition == attrs.definition
  end
end
