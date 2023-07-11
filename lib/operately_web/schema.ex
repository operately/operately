defmodule OperatelyWeb.Schema do
  use Absinthe.Schema

  alias OperatelyWeb.GraphQL.{Types, Queries, Mutations}

  import_types Absinthe.Type.Custom

  # Types
  import_types Types.Activities
  import_types Types.Assignments
  import_types Types.Comments
  import_types Types.Companies
  import_types Types.Dashboards
  import_types Types.Groups
  import_types Types.KeyResults
  import_types Types.Kpis
  import_types Types.Milestones
  import_types Types.Objectives
  import_types Types.Person
  import_types Types.Projects
  import_types Types.Reactions
  import_types Types.Tenets
  import_types Types.Updates

  # Queries
  import_types Queries.Activities
  import_types Queries.Assignments
  import_types Queries.Companies
  import_types Queries.KeyResults
  import_types Queries.Objectives
  import_types Queries.People
  import_types Queries.Projects
  import_types Queries.Updates

  # Mutations
  import_types Mutations.Dashboards
  import_types Mutations.Groups
  import_types Mutations.KeyResults
  import_types Mutations.Objectives
  import_types Mutations.People
  import_types Mutations.Projects
  import_types Mutations.Updates

  object :group_contact do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :type, non_null(:string)
    field :value, non_null(:string)
  end

  input_object :create_kpi_input do
    field :name, non_null(:string)
    field :description, :string
    field :unit, non_null(:string)
    field :target, non_null(:integer)
    field :target_direction, non_null(:string)
    field :warning_threshold, non_null(:integer)
    field :warning_direction, non_null(:string)
    field :danger_threshold, non_null(:integer)
    field :danger_direction, non_null(:string)
  end

  input_object :contact_input do
    field :name, non_null(:string)
    field :value, non_null(:string)
    field :type, non_null(:string)
  end

  query do
    import_fields :activity_queries
    import_fields :assignment_queries
    import_fields :company_queries
    import_fields :key_result_queries
    import_fields :objective_queries
    import_fields :people_queries
    import_fields :project_queries
    import_fields :update_queries

    field :kpis, list_of(:kpi) do
      resolve fn _, _, _ ->
        kpis = Operately.Kpis.list_kpis()

        {:ok, kpis}
      end
    end

    field :kpi, :kpi do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        kpi = Operately.Kpis.get_kpi!(args.id)

        {:ok, kpi}
      end
    end

    field :groups, list_of(:group) do
      resolve fn _, _, _ ->
        groups = Operately.Groups.list_groups()

        {:ok, groups}
      end
    end

    field :group, :group do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        group = Operately.Groups.get_group!(args.id)

        {:ok, group}
      end
    end

    field :tenets, list_of(:tenet) do
      resolve fn _, _, _ ->
        tenets = Operately.Tenets.list_tenets()

        {:ok, tenets}
      end
    end

    field :tenet, :tenet do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        tenet = Operately.Tenets.get_tenet!(args.id)

        {:ok, tenet}
      end
    end

    field :potential_group_members, list_of(:person) do
      arg :group_id, non_null(:id)
      arg :query, :string
      arg :exclude_ids, list_of(:id)
      arg :limit, :integer

      resolve fn args, _ ->
        people = Operately.Groups.list_potential_members(
          args.group_id,
          args.query,
          args.exclude_ids,
          args.limit
        )

        {:ok, people}
      end
    end
  end

  mutation do
    import_fields :dashboard_mutations
    import_fields :group_mutations
    import_fields :key_result_mutations
    import_fields :objective_mutations
    import_fields :people_mutations
    import_fields :project_mutations
    import_fields :update_mutations

    field :create_tenet, :tenet do
      arg :name, non_null(:string)
      arg :description, :string

      resolve fn args, _ ->
        Operately.Tenets.create_tenet(%{name: args.name, description: args[:description] || "-"})
      end
    end

    field :create_kpi, :kpi do
      arg :input, non_null(:create_kpi_input)

      resolve fn args, _ ->
        Operately.Kpis.create_kpi(args.input)
      end
    end

    field :add_members, :group do
      arg :group_id, non_null(:id)
      arg :person_ids, non_null(list_of(non_null(:id)))

      resolve fn args, _ ->
        group = Operately.Groups.get_group!(args.group_id)
        {:ok, _} = Operately.Groups.add_members(group, args.person_ids)

        {:ok, group}
      end
    end

    field :set_group_mission, :group do
      arg :group_id, non_null(:id)
      arg :mission, non_null(:string)

      resolve fn args, _ ->
        group = Operately.Groups.get_group!(args.group_id)
        {:ok, _} = Operately.Groups.set_mission(group, args.mission)

        {:ok, group}
      end
    end

    field :add_group_contact, :group do
      arg :group_id, non_null(:id)
      arg :contact, non_null(:contact_input)

      resolve fn args, _ ->
        group = Operately.Groups.get_group!(args.group_id)

        {:ok, _} = Operately.Groups.add_contact(
          group,
          args.contact.name,
          args.contact.value,
          args.contact.type
        )

        {:ok, group}
      end
    end
  end

  subscription do
    field :group_added, :group do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :project_added, :project do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :tenet_added, :tenet do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :kpi_added, :kpi do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :objective_added, :objective do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :update_added, :activity do
      arg :updatable_id, non_null(:id)
      arg :updatable_type, non_null(:string)

      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :comment_added, :comment do
      arg :updatable_id, non_null(:id)
      arg :updatable_type, non_null(:string)

      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end
  end
end
