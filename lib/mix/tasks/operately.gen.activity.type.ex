defmodule Mix.Tasks.Operately.Gen.Activity.Type do
  import Mix.Operately, only: [generate_file: 2]

  #
  # Usage example:
  # mix operately.gen.activity.type ProjectDiscussionSubmitted
  #
  def run([name]) do
    gen_graphql_type(name)
    gen_activity_content_schema(name)
    gen_notificaiton_dispatcher(name)
    gen_notification_item(name)
    gen_email_template(name)
  end

  def gen_graphql_type(name) do
    module_name = "ActivityContent#{name}"
    file_name = Macro.underscore(module_name)
    object_name = Macro.underscore(module_name)

    generate_file("lib/operately_web/graphql/types/#{file_name}.ex", fn _ ->
      """
      defmodule OperatelyWeb.Graphql.Types.#{module_name} do
        use Absinthe.Schema.Notation

        object :#{object_name} do
          field :example_field, non_null(:string) do
            resolve fn _parent, _args, _resolution ->
              "Hello World"
            end
          end
        end
      end
      """
    end)
  end

  def gen_activity_content_schema(name) do
    module_name = name
    file_name = Macro.underscore(name)

    generate_file("lib/operately/activities/content/#{file_name}.ex", fn _ ->
      """
      defmodule Operately.Activities.Content.#{module_name} do
        use Operately.Activities.Content

        embedded_schema do
          field :example_field, :string
        end

        def changeset(attrs) do
          %__MODULE__{}
          |> cast(attrs, __schema__(:fields))
          |> validate_required(__schema__(:fields))
        end

        def build(context, record) do
          raise "not implemented"
        end
      end
      """
    end)
  end

  def gen_notificaiton_dispatcher(name) do
    module_name = name
    file_name = Macro.underscore(name)

    generate_file("lib/operately/activities/notifications/#{file_name}.ex", fn _ ->
      """
      defmodule Operately.Activities.Notifications.#{module_name} do
        def dispatch(activity) do
          raise "Notification dispatcher for #{module_name} not implemented"
        end
      end
      """
    end)
  end

  def gen_notification_item(name) do
    generate_file("assets/js/pages/NotificationsPage/NotificationItem/#{name}.tsx", fn _ ->
      """
      import * as React from "react";

      import { Card } from "../NotificationCard";

      import * as People from "@/models/people";

      export default function #{name}({ notification }) {
        throw "Not implemented";
      }
      """
    end)
  end

  def gen_email_template(name) do
    generate_file("lib/operately_email/#{Macro.underscore(name <> "Email")}.ex", fn _ ->
      """
      defmodule OperatelyEmail.#{name <> "Email"} do
        def send(person, activity) do
          raise "Not implemented"
        end
      end
      """
    end)

    generate_file("lib/operately_email/views/#{Macro.underscore(name)}.ex", fn _ ->
      """
      defmodule OperatelyEmail.Views.#{name} do
        require EEx
        @templates_root "lib/operately_email/templates"

        import OperatelyEmail.Views.UIComponents

        EEx.function_from_file(:def, :html, "#\{@templates_root\}/#{Macro.underscore(name)}.html.eex", [:assigns])
        EEx.function_from_file(:def, :text, "#\{@templates_root\}/#{Macro.underscore(name)}.text.eex", [:assigns])
      end
      """
    end)

    generate_file("lib/operately_email/templates/#{Macro.underscore(name)}.html.eex", fn _ ->
      """
      <%= raise "HTML Email for #{name} not implemented" %>
      """
    end)

    generate_file("lib/operately_email/templates/#{Macro.underscore(name)}.text.eex", fn _ ->
      """
      <%= raise "Text Email for #{name} not implemented" %>
      """
    end)
  end

end
