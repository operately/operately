defmodule Operately.Support.Features.EmailSteps do
  alias Operately.FeatureCase.UI
  alias Operately.People.Person

  def assert_project_created_email_sent(ctx, author: author, project: project_name, to: to, role: role) do
    name = Person.short_name(author)

    subject = "Operately (#{ctx.company.name}): #{name} created the #{project_name} project in Operately and assigned you as a #{role}"

    ctx |> UI.assert_email_sent(subject, to: to.email)
  end
end
