defmodule Operately.Data.Change105DeleteAiPeopleAndAgentTablesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.PeopleFixtures

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
    recreate_agent_tables!()
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

  # Agent tables are dropped by the forward schema migration. Recreate a minimal
  # shape inside the test transaction so Change105 can still be exercised.
  defp recreate_agent_tables! do
    Repo.query!("""
    CREATE TABLE IF NOT EXISTS agent_defs (
      id uuid PRIMARY KEY,
      person_id uuid,
      inserted_at timestamp(0) WITHOUT TIME ZONE NOT NULL,
      updated_at timestamp(0) WITHOUT TIME ZONE NOT NULL
    )
    """)

    Repo.query!("""
    CREATE TABLE IF NOT EXISTS agent_runs (
      id uuid PRIMARY KEY,
      agent_def_id uuid,
      status varchar(255) NOT NULL,
      started_at timestamp WITHOUT TIME ZONE NOT NULL,
      inserted_at timestamp(0) WITHOUT TIME ZONE NOT NULL,
      updated_at timestamp(0) WITHOUT TIME ZONE NOT NULL
    )
    """)

    Repo.query!("""
    CREATE TABLE IF NOT EXISTS agent_convos (
      id uuid PRIMARY KEY,
      author_id uuid,
      title text,
      inserted_at timestamp(0) WITHOUT TIME ZONE NOT NULL,
      updated_at timestamp(0) WITHOUT TIME ZONE NOT NULL
    )
    """)

    Repo.query!("""
    CREATE TABLE IF NOT EXISTS agent_messages (
      id uuid PRIMARY KEY,
      convo_id uuid,
      status varchar(255) NOT NULL DEFAULT 'pending',
      message text NOT NULL,
      source varchar(255),
      index integer DEFAULT 0,
      inserted_at timestamp(0) WITHOUT TIME ZONE NOT NULL,
      updated_at timestamp(0) WITHOUT TIME ZONE NOT NULL
    )
    """)
  end

  defp insert_ai_person!(company_id, full_name) do
    now = NaiveDateTime.utc_now(:second)

    {:ok, person} =
      %Person{}
      |> Ecto.Changeset.change(%{
        id: Ecto.UUID.generate(),
        company_id: company_id,
        full_name: full_name,
        type: "ai",
        inserted_at: now,
        updated_at: now
      })
      |> Repo.insert()

    person.id
  end

  defp insert_row!("agent_defs", attrs), do: insert_schema!(%AgentDef{}, attrs)
  defp insert_row!("agent_runs", attrs), do: insert_schema!(%AgentRun{}, attrs)
  defp insert_row!("agent_convos", attrs), do: insert_schema!(%AgentConvo{}, attrs)
  defp insert_row!("agent_messages", attrs), do: insert_schema!(%AgentMessage{}, attrs)
  defp insert_row!("access_group_memberships", attrs), do: insert_schema!(%AccessGroupMembership{}, attrs)
  defp insert_row!("access_groups", attrs), do: insert_schema!(%AccessGroup{}, attrs)
  defp insert_row!("access_bindings", attrs), do: insert_schema!(%AccessBinding{}, attrs)
  defp insert_row!("members", attrs), do: insert_schema!(%Member{}, attrs)

  defp insert_schema!(schema, attrs) do
    now = NaiveDateTime.utc_now(:second)

    {:ok, record} =
      schema
      |> Ecto.Changeset.change(
        Map.merge(attrs, %{
          id: Ecto.UUID.generate(),
          inserted_at: now,
          updated_at: now
        })
      )
      |> Repo.insert()

    record.id
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
