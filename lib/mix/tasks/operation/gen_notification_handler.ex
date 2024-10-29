defmodule Mix.Tasks.Operation.GenNotificationHandler do

  def gen(ctx) do
    Mix.Operately.generate_file(ctx.notification_handler_file_path, fn _ ->
      """
      defmodule Operately.Activities.Notifications.#{ctx.operation_module_name} do
        alias Operately.Goals.Notifications

        def dispatch(_activity) do
          Operately.Notifications.bulk_create([])
        end
      end
      """
    end)
  end

end
