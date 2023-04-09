defmodule OperatelyWeb.Schema do
  use Absinthe.Schema

  object :tenet do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
  end

  object :person do
    field :id, non_null(:id)
    field :full_name, non_null(:string)
    field :title, non_null(:string)
  end

  object :project do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
  end

  object :group do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string

    field :members, list_of(non_null(:person)) do
      resolve fn group, _, _ ->
        people = Operately.Groups.list_members(group)

        {:ok, people}
      end
    end
  end

  query do
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

    field :projects, list_of(:project) do
      resolve fn _, _, _ ->
        projects = Operately.Projects.list_projects()

        {:ok, projects}
      end
    end

    field :project, :project do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        project = Operately.Projects.get_project!(args.id)

        {:ok, project}
      end
    end

    field :search_people, list_of(:person) do
      arg :query, non_null(:string)

      resolve fn args, _ ->
        people = Operately.People.search_people(args.query)

        {:ok, people}
      end
    end
  end

  mutation do
    field :create_group, :group do
      arg :name, non_null(:string)

      resolve fn args, _ ->
        Operately.Groups.create_group(%{name: args.name})
      end
    end

    field :create_project, :project do
      arg :name, non_null(:string)
      arg :description, :string

      resolve fn args, _ ->
        Operately.Projects.create_project(%{name: args.name, description: args[:description] || "-"})
      end
    end

    field :create_tenet, :tenet do
      arg :name, non_null(:string)
      arg :description, :string

      resolve fn args, _ ->
        Operately.Tenets.create_tenet(%{name: args.name, description: args[:description] || "-"})
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
  end
end
