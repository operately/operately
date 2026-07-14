defmodule Operately.Data.Change105DeleteAiPeopleAndAgentTables do
  @moduledoc """
  Removes leftover Operately AI / Alfred people and their dependent rows.

  AI people (`people.type = "ai"`) can own agent definitions/runs, access-group
  memberships, person access groups/bindings, space memberships, contributors,
  and subscriptions. Alfred conversations are authored by humans but live in
  AI-only tables that are dropped after this cleanup.

  Safe and idempotent: re-running deletes nothing when no AI people or agent
  rows remain.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{
    AccessBinding,
    AccessGroup,
    AccessGroupMembership,
    AgentConvo,
    AgentDef,
    AgentMessage,
    AgentRun,
    Company,
    Member,
    Person,
    ProjectContributor,
    Subscription
  }

  def run do
    delete_agent_messages()
    delete_agent_convos()
    delete_agent_runs()
    delete_agent_defs()
    delete_ai_people_dependents()
    delete_ai_people()
    strip_ai_experimental_feature()
  end

  defp delete_agent_messages do
    Repo.delete_all(AgentMessage)
  end

  defp delete_agent_convos do
    Repo.delete_all(AgentConvo)
  end

  defp delete_agent_runs do
    Repo.delete_all(AgentRun)
  end

  defp delete_agent_defs do
    Repo.delete_all(AgentDef)
  end

  defp delete_ai_people_dependents do
    ai_ids = ai_person_ids()

    if ai_ids != [] do
      person_group_ids =
        from(g in AccessGroup, where: g.person_id in ^ai_ids, select: g.id)
        |> Repo.all()

      if person_group_ids != [] do
        from(b in AccessBinding, where: b.group_id in ^person_group_ids)
        |> Repo.delete_all()
      end

      from(g in AccessGroup, where: g.person_id in ^ai_ids)
      |> Repo.delete_all()

      from(m in AccessGroupMembership, where: m.person_id in ^ai_ids)
      |> Repo.delete_all()

      from(m in Member, where: m.person_id in ^ai_ids)
      |> Repo.delete_all()

      from(c in ProjectContributor, where: c.person_id in ^ai_ids)
      |> Repo.delete_all()

      from(s in Subscription, where: s.person_id in ^ai_ids)
      |> Repo.delete_all()
    end
  end

  defp delete_ai_people do
    from(p in Person, where: p.type == "ai")
    |> Repo.delete_all()
  end

  defp strip_ai_experimental_feature do
    from(c in Company, where: fragment("? @> ARRAY['ai']::varchar[]", c.enabled_experimental_features))
    |> Repo.all()
    |> Enum.each(fn company ->
      features = Enum.reject(company.enabled_experimental_features || [], &(&1 == "ai"))

      from(c in Company, where: c.id == ^company.id)
      |> Repo.update_all(set: [enabled_experimental_features: features])
    end)
  end

  defp ai_person_ids do
    from(p in Person, where: p.type == "ai", select: p.id)
    |> Repo.all()
  end

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :type, :string
      field :full_name, :string
      field :company_id, :binary_id

      timestamps()
    end
  end

  defmodule AgentDef do
    use Operately.Schema

    schema "agent_defs" do
      field :person_id, :binary_id

      timestamps()
    end
  end

  defmodule AgentRun do
    use Operately.Schema

    schema "agent_runs" do
      field :agent_def_id, :binary_id

      timestamps()
    end
  end

  defmodule AgentConvo do
    use Operately.Schema

    schema "agent_convos" do
      field :author_id, :binary_id

      timestamps()
    end
  end

  defmodule AgentMessage do
    use Operately.Schema

    schema "agent_messages" do
      field :convo_id, :binary_id

      timestamps()
    end
  end

  defmodule AccessGroup do
    use Operately.Schema

    schema "access_groups" do
      field :person_id, :binary_id

      timestamps()
    end
  end

  defmodule AccessGroupMembership do
    use Operately.Schema

    schema "access_group_memberships" do
      field :group_id, :binary_id
      field :person_id, :binary_id

      timestamps()
    end
  end

  defmodule AccessBinding do
    use Operately.Schema

    schema "access_bindings" do
      field :group_id, :binary_id
      field :context_id, :binary_id

      timestamps()
    end
  end

  defmodule Member do
    use Operately.Schema

    schema "members" do
      field :group_id, :binary_id
      field :person_id, :binary_id

      timestamps()
    end
  end

  defmodule ProjectContributor do
    use Operately.Schema

    schema "project_contributors" do
      field :project_id, :binary_id
      field :person_id, :binary_id

      timestamps()
    end
  end

  defmodule Subscription do
    use Operately.Schema

    schema "subscriptions" do
      field :person_id, :binary_id
      field :subscription_list_id, :binary_id

      timestamps()
    end
  end

  defmodule Company do
    use Operately.Schema

    schema "companies" do
      field :enabled_experimental_features, {:array, :string}

      timestamps()
    end
  end
end
