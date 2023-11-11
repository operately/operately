defmodule OperatelyWeb.Graphql.Mutations.People do
  use Absinthe.Schema.Notation

  input_object :update_profile_input do
    field :full_name, :string
    field :title, :string
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

      resolve fn _, args, _ ->
        Operately.People.create_person(args)
      end
    end

    field :update_profile, :person do
      arg :input, non_null(:update_profile_input)

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person

        Operately.People.update_person(person, args.input)
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
