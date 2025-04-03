defmodule Mix.Tasks.Operation.GenEmailHandler do

  def gen(ctx) do
    Mix.Operately.generate_file(ctx.email_handler_file_path, fn _ ->
      """
      defmodule OperatelyEmail.Emails.#{ctx.email_handler_module_name} do
        import OperatelyEmail.Mailers.ActivityMailer

        def send(person, activity) do
          author = Repo.preload(activity, :author).author

          company
          |> new()
          |> from(author)
          |> to(person)
          |> subject(where: "...", who: author, action: "...")
          |> assign(:author, author)
          |> render("#{ctx.resource}_#{ctx.action_gerund}")
        end
      end
      """
    end)
  end

  def gen_html_template(ctx) do
    Mix.Operately.generate_file(ctx.email_html_template_file_path, fn _ ->
      """
      <%= title("...") %>
      """
    end)
  end

  def gen_text_template(ctx) do
    Mix.Operately.generate_file(ctx.email_text_template_file_path, fn _ ->
      """
      <%= short_name(@author) %> ...
      """
    end)
  end

end
