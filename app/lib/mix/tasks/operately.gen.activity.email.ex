defmodule Mix.Tasks.Operately.Gen.Activity.Email do
  use Mix.Task
  alias Mix.Tasks.Operately.Utils.StringUtils

  @shortdoc "Generates an email handler and templates for an activity"

  @moduledoc """
  Generates an email handler and templates for an activity.

      mix operately.gen.activity.email activity_name
  """

  def run([activity_name | _]) do
    activity = StringUtils.verify_snake_case(activity_name, "activity_name")
    module_name = StringUtils.to_camel(activity)
    email_handler_module = module_name <> "Email"
    email_handler_file_path = "lib/operately_email/emails/#{activity}_email.ex"
    email_html_template_file_path = "lib/operately_email/templates/#{activity}.html.eex"
    email_text_template_file_path = "lib/operately_email/templates/#{activity}.text.eex"

    ctx = %{
      resource: activity,
      email_handler_module_name: email_handler_module,
      email_handler_file_path: email_handler_file_path,
      email_html_template_file_path: email_html_template_file_path,
      email_text_template_file_path: email_text_template_file_path
    }

    IO.puts("")
    IO.puts("Generating email handler and templates for: #{module_name}")
    IO.puts("")
    IO.puts(" * Email Handler:        #{email_handler_file_path}")
    IO.puts(" * Email HTML Template:  #{email_html_template_file_path}")
    IO.puts(" * Email Text Template:  #{email_text_template_file_path}")
    IO.puts("")

    Mix.Tasks.Operation.GenEmailHandler.gen(ctx)
    Mix.Tasks.Operation.GenEmailHandler.gen_html_template(ctx)
    Mix.Tasks.Operation.GenEmailHandler.gen_text_template(ctx)
  end

  def run(_) do
    Mix.raise("Usage: mix operately.gen.activity.email activity_name")
  end
end
