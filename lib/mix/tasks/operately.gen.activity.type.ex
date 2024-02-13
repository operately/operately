defmodule Mix.Tasks.Operately.Gen.Activity.Type do
  import Mix.Operately, only: [generate_file: 2, indent: 2]

  @supported_types ~w(string integer float boolean)

  #
  # Usage example:
  # mix operately.gen.activity.type ProjectCreation company_id:string space_id:string name:string
  #
  def run([name | fields]) do
    name = parse_name(name)
    fields = parse_fields(fields)

    gen_operation(name, fields)
    gen_graphql_type(name, fields)
    gen_activity_content_schema(name, fields)
    gen_notificaiton_dispatcher(name)
    gen_notification_item(name)
    gen_feed_item(name)
    gen_email_template(name)
  end

  def gen_operation(name, fields) do
    module_name = name
    action_name = Macro.underscore(name)
    file_name = Macro.underscore(module_name)
    activity_fields = Enum.map(fields, fn {field_name, _field_type} -> "    \#   #{field_name}: \"TODO\"" end)

    generate_file("lib/operately/operations/#{file_name}.ex", fn _ ->
      """
      defmodule Operately.Operations.#{module_name} do
        alias Ecto.Multi
        alias Operately.Repo
        alias Operately.Activities

        def run(creator, attrs) do
          raise "Operation for #{module_name} not implemented"

          # Multi.new()
          # |> Multi.insert(:something, ...)
          # |> Activities.insert(creator.id, :#{action_name}, fn changes ->
          #   %{
      #{activity_fields}
          #   }
          # end)
          # |> Repo.transaction()
          # |> Repo.extract_result(:something)
        end
      end
      """
    end)
  end

  def gen_graphql_type(name, fields) do
    module_name = "ActivityContent#{name}"
    file_name = Macro.underscore(module_name)
    object_name = Macro.underscore(module_name)

    field_fragments = Enum.map(fields, fn {field_name, field_type} ->
      """
      field :#{field_name}, non_null(:#{field_type}) do
        resolve fn activity, _, _ ->
          {:ok, activity.content["#{field_name}"]}
        end
      end
      """
    end)

    generate_file("lib/operately_web/graphql/types/#{file_name}.ex", fn _ ->
      """
      defmodule OperatelyWeb.Graphql.Types.#{module_name} do
        use Absinthe.Schema.Notation

        object :#{object_name} do
          #{field_fragments |> Enum.join("\n\n") |> indent(4)}
        end
      end
      """
    end)
  end

  def gen_activity_content_schema(name, fields) do
    module_name = name
    file_name = Macro.underscore(name)

    generate_file("lib/operately/activities/content/#{file_name}.ex", fn _ ->
      """
      defmodule Operately.Activities.Content.#{module_name} do
        use Operately.Activities.Content

        embedded_schema do
          #{Enum.map(fields, fn {field_name, field_type} -> "field :#{field_name}, :#{field_type}" end) |> Enum.join("\n") |> indent(2)}
        end

        def changeset(attrs) do
          %__MODULE__{}
          |> cast(attrs, __schema__(:fields))
          |> validate_required(__schema__(:fields))
        end

        def build(params) do
          changeset(params)
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

      export default function({ notification }) {
        throw "Not implemented";
      }
      """
    end)
  end

  def gen_feed_item(name) do
    generate_file("assets/js/components/Feed/FeedItem/#{name}.tsx", fn _ ->
      """
      import * as React from "react";

      import { Card } from "../NotificationCard";

      import * as People from "@/models/people";

      export default function({ notification, page }) {
        throw "Not implemented";
      }
      """
    end)
  end

  def gen_email_template(name) do
    generate_file("lib/operately_email/emails/#{Macro.underscore(name <> "Email")}.ex", fn _ ->
      """
      defmodule OperatelyEmail.Emails.#{name <> "Email"} do
        import OperatelyEmail.Mailers.ActivityMailer

        def send(person, activity) do
          raise "Email for #{name} not implemented"

          # author = Repo.preload(activity, :author).author

          # company
          # |> new()
          # |> to(person)
          # |> subject(who: author, action: "did something")
          # |> assign(:author, author)
          # |> render("#{Macro.underscore(name)}")
        end
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

  defp parse_name(name) do
    if String.contains?(name, "-") do
      raise """
      Activity name should be camel case. Example: ProjectDiscussionSubmitted
      """
    end

    if String.contains?(name, "_") do
      raise """
      Activity name should be camel case. Example: ProjectDiscussionSubmitted
      """
    end

    name
  end

  defp parse_fields(fields) do
    if Enum.empty?(fields) do
      raise """
      Activity should have at least one field. Example: mix operately.gen.activity.type ProjectCreation company_id:string space_id:string name:string
      """
    end

    Enum.each(fields, fn field ->
      unless String.contains?(field, ":") do
        raise """
        Every field should have a type. Example: mix operately.gen.activity.type ProjectCreation company_id:string space_id:string name:string
        """
      end
      
      [name, fieldType] = String.split(field, ":")

      unless Enum.member?(@supported_types, fieldType) do
        raise """
        #{fieldType} is not a supported type in #{name}:#{fieldType}. Supported types are: #{@supported_types}
        """
      end
    end)

    fields |> Enum.map(fn field ->
      [name, fieldType] = String.split(field, ":")
      {name, fieldType}
    end)
  end
end
