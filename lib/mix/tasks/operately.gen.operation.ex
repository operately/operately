defmodule Mix.Tasks.Operately.Gen.Operation do
  # import Mix.Operately, only: [generate_file: 2, indent: 2]

  # @supported_types ~w(string integer float boolean)
  alias Mix.Tasks.Operately.Utils.StringUtils

  def run(_) do
    resource = get_resource_name() 
    [action, action_gerund] = get_action_name()

    ctx = initialize_context(resource, action, action_gerund)

    IO.puts("Generating operation: #{ctx.operation_module_name}")
    IO.puts("")

    IO.puts("This will generate the following:")
    IO.puts("")
    IO.puts(" * Operation:            #{ctx.operation_file_path}")
    IO.puts(" * API Mutation:         #{ctx.api_mutation_file_path}")
    IO.puts(" * Activity Schema:      #{ctx.activity_schema_file_path}")
    IO.puts(" * Notification Handler: #{ctx.notification_handler_file_path}")
    IO.puts(" * Email Handler:        #{ctx.email_handler_file_path}")
    IO.puts(" * Email HTML Template:  #{ctx.email_html_template_file_path}")
    IO.puts(" * Email Text Template:  #{ctx.email_text_template_file_path}")
    IO.puts(" * Activity Item:        #{ctx.activity_item_file_path}")

    IO.puts("")
    continue?()

    IO.puts("")
    IO.puts("A few more questions:")

    api_inputs = get_api_inputs()
    ctx = Map.put(ctx, :api_inputs, api_inputs)

    activity_fields = get_activity_fields()
    ctx = Map.put(ctx, :activity_fields, activity_fields)

    IO.inspect(ctx)

    System.halt(1)

    # name = parse_name(name)
    # fields = get_fields()

    # gen_operation(name, fields)
    # gen_activity_content_schema(name, fields)
    # gen_notificaiton_dispatcher(name)
    # gen_notification_item(name)
    # gen_feed_item(name)
    # gen_email_template(name)
  end

  defp initialize_context(resource, action, action_gerund) do
    operation_module_name = "#{Macro.camelize(resource)}#{Macro.camelize(action_gerund)}"
    activity_item_name = "#{Macro.camelize(resource)}#{Macro.camelize(action_gerund)}"

    %{
      resource: resource,
      action: action,
      action_gerund: action_gerund,

      operation_module_name: operation_module_name,
      activity_item_name: activity_item_name,

      operation_file_path: "lib/operately/operations/#{resource}_#{action_gerund}.ex",
      api_mutation_file_path: "lib/opertely_web/api/mutations/#{action}_#{resource}.ex",
      activity_schema_file_path: "lib/operately/activities/content/#{resource}_#{action_gerund}.ex",
      notification_handler_file_path: "lib/operately/activities/notifications/#{resource}_#{action_gerund}.ex",
      email_handler_file_path: "lib/operately_email/emails/#{resource}_#{action_gerund}_email.ex",
      email_html_template_file_path: "lib/operately_email/templates/#{resource}_#{action_gerund}.html.eex",
      email_text_template_file_path: "lib/operately_email/templates/#{resource}_#{action_gerund}.text.eex",
      activity_item_file_path: "assets/js/features/activities/#{activity_item_name}/index.tsx",
    }
  end

  def add_fields_to_context(ctx, fields) do
    Map.put(ctx, :fields, fields)
  end

  defp  get_resource_name do
    name = IO.gets("Enter resource name: (e.g project_milestone): ") 
    name = String.trim(name)

    StringUtils.verify_snake_case(name, "project_milestone")
  end

  defp get_action_name do
    action = IO.gets("Enter action name: (e.g create): ") |> String.trim()

    gerund = case action do
      "add" -> "adding"
      "create" -> "creating"
      "update" -> "updating"
      "delete" -> "deleting"
      "remove" -> "removing"
      "move" -> "moving"
      "post" -> "posting"
      "submit" -> "submitting"
      "approve" -> "approving"
      "reject" -> "rejecting"
      "edit" -> "editing"

      _ -> IO.gets("Enter gerund form of the action: (e.g add -> adding): ") |> String.trim()
    end

    [action, gerund]
  end

  #def gen_operation(name, fields) do
  #  module_name = name
  #  action_name = Macro.underscore(name)
  #  file_name = Macro.underscore(module_name)
  #  activity_fields = Enum.map(fields, fn {field_name, _field_type} -> "    \#   #{field_name}: \"TODO\"" end)

  #  generate_file("lib/operately/operations/#{file_name}.ex", fn _ ->
  #    """
  #    defmodule Operately.Operations.#{module_name} do
  #      alias Ecto.Multi
  #      alias Operately.Repo
  #      alias Operately.Activities

  #      def run(creator, attrs) do
  #        raise "Operation for #{module_name} not implemented"

  #        # Multi.new()
  #        # |> Multi.insert(:something, ...)
  #        # |> Activities.insert_sync(creator.id, :#{action_name}, fn changes ->
  #        #   %{
  #    #{activity_fields}
  #        #   }
  #        # end)
  #        # |> Repo.transaction()
  #        # |> Repo.extract_result(:something)
  #      end
  #    end
  #    """
  #  end)
  #end

  #def gen_activity_content_schema(name, fields) do
  #  module_name = name
  #  file_name = Macro.underscore(name)

  #  generate_file("lib/operately/activities/content/#{file_name}.ex", fn _ ->
  #    """
  #    defmodule Operately.Activities.Content.#{module_name} do
  #      use Operately.Activities.Content

  #      embedded_schema do
  #        #{Enum.map(fields, fn {field_name, field_type} -> "field :#{field_name}, :#{field_type}" end) |> Enum.join("\n") |> indent(2)}
  #      end

  #      def changeset(attrs) do
  #        %__MODULE__{}
  #        |> cast(attrs, __schema__(:fields))
  #        |> validate_required(__schema__(:fields))
  #      end

  #      def build(params) do
  #        changeset(params)
  #      end
  #    end
  #    """
  #  end)
  #end

  #def gen_notificaiton_dispatcher(name) do
  #  module_name = name
  #  file_name = Macro.underscore(name)

  #  generate_file("lib/operately/activities/notifications/#{file_name}.ex", fn _ ->
  #    """
  #    defmodule Operately.Activities.Notifications.#{module_name} do
  #      def dispatch(activity) do
  #        {:ok, []}
  #      end
  #    end
  #    """
  #  end)
  #end

  #def gen_notification_item(name) do
  #  generate_file("assets/js/pages/NotificationsPage/NotificationItem/#{name}.tsx", fn _ ->
  #    """
  #    // import * as React from "react";

  #    export default function({ notification }) {
  #      throw "Not implemented";
  #    }
  #    """
  #  end)
  #end

  #def gen_feed_item(name) do
  #  generate_file("assets/js/features/Feed/FeedItems/#{name}.tsx", fn _ ->
  #    """
  #    import { FeedItem } from "../FeedItem";

  #    export const #{name}: FeedItem = {
  #      typename: "ActivityContent#{name}",
  #      contentQuery: ``,
  #      component: () => null,
  #    };
  #    """
  #  end)
  #end

  #def gen_email_template(name) do
  #  generate_file("lib/operately_email/emails/#{Macro.underscore(name <> "Email")}.ex", fn _ ->
  #    """
  #    defmodule OperatelyEmail.Emails.#{name <> "Email"} do
  #      import OperatelyEmail.Mailers.ActivityMailer

  #      def send(person, activity) do
  #        raise "Email for #{name} not implemented"

  #        # author = Repo.preload(activity, :author).author

  #        # company
  #        # |> new()
  #        # |> to(person)
  #        # |> subject(who: author, action: "did something")
  #        # |> assign(:author, author)
  #        # |> render("#{Macro.underscore(name)}")
  #      end
  #    end
  #    """
  #  end)

  #  generate_file("lib/operately_email/templates/#{Macro.underscore(name)}.html.eex", fn _ ->
  #    """
  #    <%= raise "HTML Email for #{name} not implemented" %>
  #    """
  #  end)

  #  generate_file("lib/operately_email/templates/#{Macro.underscore(name)}.text.eex", fn _ ->
  #    """
  #    <%= raise "Text Email for #{name} not implemented" %>
  #    """
  #  end)
  #end

  #defp parse_name(name) do
  #  if String.contains?(name, "-") do
  #    raise """
  #    Operation name should be camel case. Example: ProjectDiscussionSubmitted
  #    """
  #  end

  #  if String.contains?(name, "_") do
  #    raise """
  #    Operation name should be camel case. Example: ProjectDiscussionSubmitted
  #    """
  #  end

  #  name
  #end

  #defp get_fields do
  #  fields = IO.gets("Enter fields (e.g. company_id:string space_id:string name:string): ") 
  #  fields = fields |> String.trim() |> String.split(~r/\s+/)

  #  if Enum.empty?(fields) do
  #    raise """
  #    Activity should have at least one field. Example: mix operately.gen.activity.type ProjectCreation company_id:string space_id:string name:string
  #    """
  #  end

  #  Enum.each(fields, fn field ->
  #    unless String.contains?(field, ":") do
  #      raise """
  #      Every field should have a type. Example: mix operately.gen.activity.type ProjectCreation company_id:string space_id:string name:string
  #      """
  #    end
      
  #    [name, fieldType] = String.split(field, ":")

  #    unless Enum.member?(@supported_types, fieldType) do
  #      raise """
  #      #{fieldType} is not a supported type in #{name}:#{fieldType}. Supported types are: #{@supported_types}
  #      """
  #    end
  #  end)

  #  fields |> Enum.map(fn field ->
  #    [name, fieldType] = String.split(field, ":")
  #    {name, fieldType}
  #  end)
  #end

  def get_api_inputs do
    IO.puts("")
    IO.puts("1. What are the inputs for the api mutation?")
    IO.puts("   e.g company_id:string space_id:string name:string")
    IO.puts("")
    IO.gets(">  ") |> String.trim() |> String.split(~r/\s+/)
  end

  def get_activity_fields do
    IO.puts("")
    IO.puts("2. What data should be stored in the activity?")
    IO.puts("   e.g company_id:string space_id:string name:string")
    IO.puts("")
    IO.gets(">  ") |> String.trim() |> String.split(~r/\s+/)
  end

  def continue? do
    case IO.gets("Continue? (y/n): ") do
      "y\n" -> true
      "n\n" -> false
      _ -> continue?()
    end
  end
end
