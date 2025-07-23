defmodule Operately.Support.Features.ProjectDiscussionSteps do
  use Operately.FeatureCase

  # alias Operately.Support.Features.ProjectSteps
  # alias Operately.Support.Features.FeedSteps
  # alias Operately.Support.Features.NotificationsSteps
  # alias Operately.Support.Features.EmailSteps

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing)
    |> Factory.add_project(:alpha, :marketing)
  end
end
