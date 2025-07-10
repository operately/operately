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
      full_name: "Alfred Iverson"
    }

    {:ok, person} = AgentAdding.run(ctx.creator, attrs)

    assert person.full_name == "Alfred Iverson"
    assert person.title == "Chief Operating Officer (COO)"
    assert person.type == :ai

    assert Repo.get_by!(AgentDef, person_id: person.id)
  end
end
