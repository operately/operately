export const ProjectPitchSchema = {
  type: "document",
  name: "pitch",
  title: "Project Pitch",
  subtitle: "What is the project about, why is it important, and why should it be persued?",
  content: [
    {
      type: "richtext",
      name: "description",
      placeholder: "Write your project pitch here...",
    },
  ],
};

export const ExecutionPlanSchema = {
  type: "document",
  name: "plan",
  title: "Execution Plan",
  subtitle: "How will the project be executed? What are the risks and how will they be mitigated?",
  content: [
    {
      type: "richtext",
      name: "description",
      placeholder: "Write your execution plan here...",
    },
    {
      type: "yes_no_question",
      name: "budget",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Are the budget, timeline and milestones clear and realistic?",
    },
    {
      type: "yes_no_question",
      name: "pitch",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Is the pitch clear to the team and in line with the company's goals?",
    },
    {
      type: "yes_no_question",
      name: "team",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Is the team staffed with suitable roles for execution?",
    },
    {
      type: "yes_no_question",
      name: "risks",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Are there any outstanding risks for the project?",
    },
  ],
};

export const ExecutionReviewSchema = {
  type: "document",
  name: "execution_review",
  title: "Execution Review",
  subtitle: "How did the execution go? Were there any issues? How were they resolved?",
  content: [
    {
      type: "richtext",
      name: "description",
      placeholder: "Write your execution review here...",
    },
    {
      type: "yes_no_question",
      name: "schedule",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Was the execution completed on schedule?",
    },
    {
      type: "yes_no_question",
      name: "budget",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Was the execution completed within budget?",
    },
    {
      type: "yes_no_question",
      name: "roles",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Was the team staffed with suitable roles for execution?",
    },
    {
      type: "yes_no_question",
      name: "risks",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Are there any outstanding risks for the project?",
    },
  ],
};

export const RetrospectiveSchema = {
  type: "document",
  name: "retrospective",
  title: "Retrospective",
  subtitle: "What went well? What could be improved?",
  content: [
    {
      type: "paragraph_question",
      name: "what_went_well",
      question: "What went well?",
    },
    {
      type: "paragraph_question",
      name: "what_could_be_improved",
      question: "What could be improved?",
    },
    {
      type: "paragraph_question",
      name: "what_did_we_learn",
      question: "What did we learn?",
    },
    {
      type: "yes_no_question",
      name: "goals",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Was the project executed in line with the company's goals?",
    },
    {
      type: "yes_no_question",
      name: "schedule",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Was the project completed on schedule and within budget?",
    },
    {
      type: "yes_no_question",
      name: "roles",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      question: "Was the team staffed with suitable roles for execution?",
    },
  ],
};
