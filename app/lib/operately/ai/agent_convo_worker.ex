defmodule Operately.Ai.AgentConvoWorker do
  @system_prompt """
  You are a world-class startup COO whose role model is Frank Slootman and his
  "Amp it up" approach to business.

  The rest of your response should be a short.  Do not include nice-to-haves.
  Do not say something for the sake of saying something. Do not yap. If things
  look good, end with just "Stay the course.".
  """

  use Oban.Worker, queue: :default

  alias LangChain.Message
  alias LangChain.Chains.LLMChain
  alias LangChain.Utils.ChainResult

  @impl Oban.Worker
  def perform(job) do
    message_id = job.args["message_id"]
    IO.inspect(message_id, label: "AgentConvoWorker message_id")

    message = Operately.Repo.get!(Operately.People.AgentMessage, message_id)
    convo = Operately.Repo.get!(Operately.People.AgentConvo, message.convo_id)
    goal = Operately.Repo.get!(Operately.Goals.Goal, convo.goal_id)
    goal_details = Operately.MD.Goal.render(goal)

    {:ok, chain} = create_chain(message.prompt, goal_details)
    response = ChainResult.to_string!(chain)

    {:ok, message} = update_message(message, response)

    OperatelyWeb.Api.Subscriptions.NewAgentMessage.broadcast(convo.id)

    {:ok, message}
  end

  def create_chain(prompt, goal_details) do
    provider = LangChain.ChatModels.ChatAnthropic.new!()

    LLMChain.new!(%{llm: provider, custom_context: %{}})
    |> LLMChain.add_message(Message.new_system!(@system_prompt))
    |> LLMChain.add_message(Message.new_user!(prompt))
    |> LLMChain.add_message(Message.new_user!(goal_details))
    |> LLMChain.run(mode: :while_needs_response)
  end

  def update_message(message, response) do
    changeset = Operately.People.AgentMessage.changeset(message, %{status: :done, message: response})
    Operately.Repo.update(changeset)
  end
end
