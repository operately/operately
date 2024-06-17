defmodule OperatelyWeb.Graphql.Mutations.People do
  use Absinthe.Schema.Notation

  input_object :update_profile_input do
    field :full_name, :string
    field :title, :string
    field :manager_id, :id
    field :timezone, :string
    field :avatar_url, :string
    field :avatar_blob_id, :id
  end

  input_object :update_notification_settings_input do
    field :send_daily_summary, :boolean
    field :notify_on_mention, :boolean
    field :notify_about_assignments, :boolean
  end

  input_object :update_appearance_input do
    field :theme, :string
  end

  object :person_mutations do
    field :create_profile, :person do
      arg :full_name, non_null(:string)
      arg :title, non_null(:string)
      arg :timezone, non_null(:string)
      arg :avatar_url, non_null(:string)
      arg :avatar_blob_id, :id

      resolve fn _, args, _ ->
        Operately.People.create_person(args)
      end
    end

    field :update_profile, :person do
      arg :input, non_null(:update_profile_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.People.update_person(person, %{
          full_name: args.input.full_name,
          title: args.input.title,
          timezone: args.input.timezone,
          blob_id: args.input.avatar_blob_id,
          avatar_url: args.input.avatar_url,
          manager_id: args.input[:manager_id]
        })
      end
    end

    field :update_notification_settings, :person do
      arg :input, non_null(:update_notification_settings_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.People.update_person(person, args.input)
      end
    end

    field :update_appearance, :person do
      arg :input, non_null(:update_appearance_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.People.update_person(person, %{theme: args.input.theme})
      end
    end
  end
end
