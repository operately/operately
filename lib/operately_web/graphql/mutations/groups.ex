defmodule OperatelyWeb.Graphql.Mutations.Groups do
  use Absinthe.Schema.Notation

  input_object :create_group_input do
    field :name, non_null(:string)
    field :mission, non_null(:string)
    field :icon, non_null(:string)
    field :color, non_null(:string)
  end

  input_object :contact_input do
    field :name, non_null(:string)
    field :value, non_null(:string)
    field :type, non_null(:string)
  end

  input_object :update_group_appearance_input do
    field :id, non_null(:id)
    field :icon, non_null(:string)
    field :color, non_null(:string)
  end

  object :group_contact do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :type, non_null(:string)
    field :value, non_null(:string)
  end

  input_object :edit_group_input do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :mission, non_null(:string)
  end

  object :group_mutations do
    field :create_group, :group do
      arg :input, non_null(:create_group_input)

      resolve fn args, %{context: context} ->
        creator = context.current_account.person

        attrs = %{
          name: args.input.name,
          mission: args.input.mission,
          icon: args.input.icon,
          color: args.input.color
        }

        Operately.Groups.create_group(creator, attrs)
      end
    end

    field :edit_group, :group do
      arg :input, non_null(:edit_group_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person

        group = Operately.Groups.get_group!(args.input.id)

        {:ok, _} = Operately.Groups.edit_group_name_and_purpose(author, group, %{
          name: args.input.name,
          mission: args.input.mission
        })

        {:ok, group}
      end
    end

    field :add_group_members, :group do
      arg :group_id, non_null(:id)
      arg :person_ids, non_null(list_of(non_null(:id)))

      resolve fn args, _ ->
        group = Operately.Groups.get_group!(args.group_id)
        {:ok, _} = Operately.Groups.add_members(group, args.person_ids)

        {:ok, group}
      end
    end

    field :remove_group_member, :group do
      arg :group_id, non_null(:id)
      arg :member_id, non_null(:id)

      resolve fn args, _ ->
        group = Operately.Groups.get_group(args.group_id)

        Operately.Groups.remove_member(group, args.member_id)

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

    field :update_group_appearance, non_null(:group) do
      arg :input, non_null(:update_group_appearance_input)

      resolve fn args, _ ->
        group = Operately.Groups.get_group!(args.input.id)

        {:ok, _} = Operately.Groups.update_group(group, %{
          icon: args.input.icon,
          color: args.input.color
        })

        {:ok, group}
      end
    end
  end
end
