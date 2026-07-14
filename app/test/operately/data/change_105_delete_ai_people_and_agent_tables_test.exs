defmodule Operately.Data.Change105DeleteAiPeopleAndAgentTablesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.Factory
  alias Operately.Data.Change105DeleteAiPeopleAndAgentTables, as: Change
  alias Operately.Data.Change105DeleteAiPeopleAndAgentTables.{
    AccessBinding,
    AccessGroup,
    AccessGroupMembership,
    AgentConvo,
    AgentDef,
    AgentMessage,
    AgentRun,
    Company,
    Member,
    Person
  }

  setup do
    Factory.setup(%{})
  end

  test "deletes AI people and dependents while keeping humans and guests", ctx do
    human = person_fixture(%{company_id: ctx.company.id, full_name: "Human Member", type: :human})
    guest = person_fixture(%{company_id: ctx.company.id, full_name: "Guest Member", type: :guest})
    ai_id = insert_ai_person!(ctx.company.id, "Alfred Agent")

    agent_def_id = insert_row!("agent_defs", %{person_id: ai_id})
    agent_run_id = insert_row!("agent_runs", %{
      agent_def_id: agent_def_id,
      status: "completed",
      started_at: DateTime.utc_now()
    })
    convo_id = insert_row!("agent_convos", %{author_id: human.id, title: "Alfred chat"})
    message_id = insert_row!("agent_messages", %{
      convo_id: convo_id,
      status: "done",
      message: "Hello",
      source: "user",
      index: 0
    })

    space_group = company_space_access_group!(ctx.company.id)
    insert_row!("access_group_memberships", %{group_id: space_group.id, person_id: ai_id})

    person_group_id = insert_row!("access_groups", %{person_id: ai_id})
    space_context = company_space_access_context!(ctx.company.id)
    insert_row!("access_bindings", %{
      group_id: person_group_id,
      context_id: space_context.id,
      access_level: 70
    })

    insert_row!("members", %{group_id: ctx.company.company_space_id, person_id: ai_id})
    enable_ai_feature!(ctx.company.id)

    Change.run()
    Change.run()

    assert Repo.get(Person, human.id)
    assert Repo.get(Person, guest.id)
    refute Repo.get(Person, ai_id)

    refute Repo.get(AgentDef, agent_def_id)
    refute Repo.get(AgentRun, agent_run_id)
    refute Repo.get(AgentConvo, convo_id)
    refute Repo.get(AgentMessage, message_id)
    refute Repo.get(AccessGroup, person_group_id)

    assert Repo.aggregate(from(m in AccessGroupMembership, where: m.person_id == ^ai_id), :count) == 0
    assert Repo.aggregate(from(m in Member, where: m.person_id == ^ai_id), :count) == 0
    assert Repo.aggregate(from(b in AccessBinding, where: b.group_id == ^person_group_id), :count) == 0

    company = Repo.get!(Company, ctx.company.id)
    refute "ai" in (company.enabled_experimental_features || [])
  end

  defp insert_ai_person!(company_id, full_name) do
    insert_row!("people", %{
      company_id: company_id,
      full_name: full_name,
      title: "Agent",
      email: "ai-#{System.unique_integer()}@example.com",
      type: "ai",
      suspended: false
    })
  end

  defp insert_row!(table, attrs) do
    id = Ecto.UUID.generate()
    now = NaiveDateTime.utc_now(:second)

    attrs =
      attrs
      |> Map.put(:id, id)
      |> Map.put_new(:inserted_at, now)
      |> Map.put_new(:updated_at, now)

    {1, _} = Repo.insert_all(table, [attrs])
    id
  end

  defp company_space_access_group!(company_id) do
    company = Operately.Companies.get_company!(company_id)
    space = Operately.Groups.get_group!(company.company_space_id)
    Operately.Access.get_group!(group_id: space.id, tag: :standard)
  end

  defp company_space_access_context!(company_id) do
    company = Operately.Companies.get_company!(company_id)
    Operately.Access.get_context!(group_id: company.company_space_id)
  end

  defp enable_ai_feature!(company_id) do
    company = Repo.get!(Company, company_id)
    features = Enum.uniq((company.enabled_experimental_features || []) ++ ["ai"])

    from(c in Company, where: c.id == ^company_id)
    |> Repo.update_all(set: [enabled_experimental_features: features])
  end
end
