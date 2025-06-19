defmodule Mix.Tasks.Operately.Gen.Activity do
  alias Mix.Tasks.Operately.Utils.StringUtils

  def run(_) do
    resource = get_resource_name()
    [action, action_gerund] = get_action_name()

    ctx = initialize_context(resource, action, action_gerund)

    IO.puts("")
    IO.puts("Generating activity: #{ctx.activity_item_name}")
    IO.puts("")

    IO.puts("This will generate the following:")
    IO.puts("")
    IO.puts(" * Activity Schema:      #{ctx.activity_schema_file_path}")
    IO.puts(" * Notification Handler: #{ctx.notification_handler_file_path}")
    IO.puts(" * Serializer:           #{ctx.serializer_file_path}")
    IO.puts(" * Activity Item:        #{ctx.activity_item_file_path}")

    continue?()

    IO.puts("")
    IO.puts("A few more questions:")

    activity_fields = get_activity_fields()
    ctx = Map.put(ctx, :activity_fields, activity_fields)

    continue?()

    generate_files(ctx)
  end

  def generate_files(ctx) do
    Mix.Tasks.Operation.GenActivitySchema.gen(ctx)
    Mix.Tasks.Operation.GenNotificationHandler.gen(ctx)
    Mix.Tasks.Operation.GenActivityItem.gen(ctx)
    Mix.Tasks.Operation.GenApiTypes.gen(ctx)
    Mix.Tasks.Operation.GenSerializer.gen(ctx)
  end

  defp initialize_context(resource, action, action_gerund) do
    activity_item_name = "#{Macro.camelize(resource)}#{Macro.camelize(action_gerund)}"

    %{
      resource: resource,
      action: action,
      action_gerund: action_gerund,
      activity_item_name: activity_item_name,
      activity_action_name: "#{resource}_#{action_gerund}",
      api_module_name: "#{Macro.camelize(action)}#{Macro.camelize(resource)}",
      activity_schema_module_name: "#{Macro.camelize(resource)}#{Macro.camelize(action_gerund)}",
      activity_item_handler_name: "#{Macro.camelize(resource)}#{Macro.camelize(action_gerund)}",
      serializer_file_path: "lib/operately_web/api/serializers/activity_content/#{resource}_#{action_gerund}.ex",
      api_types_file_path: "lib/operately_web/api/types.ex",
      activity_schema_file_path: "lib/operately/activities/content/#{resource}_#{action_gerund}.ex",
      notification_handler_file_path: "lib/operately/activities/notifications/#{resource}_#{action_gerund}.ex",
      activity_item_file_path: "assets/js/features/activities/#{activity_item_name}/index.tsx"
    }
  end

  defp get_resource_name do
    name = IO.gets("Enter resource name: (e.g goal_champion): ")
    name = String.trim(name)

    StringUtils.verify_snake_case(name, "goal")
  end

  defp get_action_name do
    action = IO.gets("Enter action name: (e.g create): ") |> String.trim()

    gerund =
      case action do
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

  def get_activity_fields do
    IO.puts("")
    IO.puts("2. What data should be stored in the activity?")
    IO.puts("   e.g company_id:comany space_id:space name:string")
    IO.puts("")

    IO.gets(">  ")
    |> String.trim()
    |> String.split(~r/\s+/)
    |> Enum.map(fn field ->
      [name, fieldType] = String.split(field, ":")
      {name, fieldType}
    end)
  end

  def continue? do
    IO.puts("")

    case IO.gets("Continue? (y/n): ") do
      "y\n" -> IO.puts("")
      "n\n" -> System.halt(1)
      _ -> continue?()
    end
  end
end
