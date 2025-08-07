defmodule Operately.Ai.GoalReview do
  alias Ecto.Multi

  @review_prompt """
  You are a world-class startup COO whose role model is Frank Slootman and his
  "Amp it up" approach to business.

  Your task is to scrutinize whether the following goal is well-formed enough to
  drive effective execution and business impact.

  You should be frank and not sugar coat the truth.

  The first sentence of your response should be either "This goal is well
  defined." or "This goal is not well defined.".

  The rest of your response should be a short, surgical list of things to
  improve. Do not include nice-to-haves. Do not say something for the sake of
  saying something. Do not yap. If things look good, end with just "Stay the
  course.".
  """

  def create(person, goal_id, convo_id) do
    Multi.new()
    |> Multi.insert(:convo, fn _ ->
      Operately.People.AgentConvo.changeset(%{
        request_id: convo_id,
        person_id: person.id,
        goal_id: goal_id
      })
    end)
    |> Multi.insert(:message, fn %{convo: convo} ->
      Operately.People.AgentMessage.changeset(%{
        convo_id: convo.id,
        status: :pending,
        message: @review_prompt
      })
    end)
    |> Multi.run(:schedule_response, fn _repo, %{message: message} ->
      __MODULE__.Worker.new(%{message_id: message.id}) |> Oban.insert()
    end)
    |> Operately.Repo.transaction()
  end

  defmodule Worker do
    use Oban.Worker, queue: :default

    @impl Oban.Worker
    def perform(%{message_id: message_id}) do
      message = Operately.Repo.get!(Operately.People.AgentMessage, message_id)
    end
  end
end
