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
        title: "Goal Review",
        request_id: convo_id,
        author_id: person.id,
        goal_id: goal_id
      })
    end)
    |> Multi.insert(:message, fn %{convo: convo} ->
      Operately.People.AgentMessage.changeset(%{
        convo_id: convo.id,
        status: :pending,
        source: :ai,
        prompt: @review_prompt,
        message: "Reviewing..."
      })
    end)
    |> Multi.run(:schedule_response, fn _repo, %{message: message} ->
      __MODULE__.Worker.new(%{message_id: message.id}) |> Oban.insert()
    end)
    |> Operately.Repo.transaction()
  end

  defmodule Worker do
    use Oban.Worker, queue: :default

    alias LangChain.Message
    alias LangChain.Chains.LLMChain
    alias LangChain.Utils.ChainResult

    @impl Oban.Worker
    def perform(job) do
      message_id = job.args["message_id"]
      message = Operately.Repo.get!(Operately.People.AgentMessage, message_id)
      convo = Operately.Repo.get!(Operately.People.AgentConvo, message.convo_id)
      goal = Operately.Repo.get!(Operately.Goals.Goal, convo.goal_id)
      goal_details = Operately.MD.Goal.render(goal)

      {:ok, chain} = create_chain(message.prompt, goal_details)
      response = ChainResult.to_string!(chain)

      update_message(message, response)
    end

    def create_chain(prompt, goal_details) do
      provider = LangChain.ChatModels.ChatAnthropic.new!()

      LLMChain.new!(%{llm: provider, custom_context: %{}})
      |> LLMChain.add_message(Message.new_user!(prompt))
      |> LLMChain.add_message(Message.new_user!(goal_details))
      |> LLMChain.run(mode: :while_needs_response)
    end

    def update_message(message, response) do
      changeset = Operately.People.AgentMessage.changeset(message, %{status: :done, message: response})
      Operately.Repo.update(changeset)
    end
  end
end
